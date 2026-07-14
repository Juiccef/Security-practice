#!/usr/bin/env node
// One-time PDF -> question bank parser.
//
// Reads the Professor Messer style practice exam PDF (three exams, each with
// a "Detailed Answers" section that restates every question, names the
// correct choice(s), and explains every choice), and writes a structured
// JSON question bank the app reads at runtime. Re-run this whenever the
// source PDF changes; the app never parses the PDF itself.
//
// Usage: node scripts/parse-exam.mjs <path-to-pdf> [--out public/data/questions.json]
//
// The app fetches its question bank from public/data/questions.json at
// runtime (see src/lib/questionBank.ts) rather than importing it at build
// time, so dropping in a freshly parsed JSON file and refreshing the page is
// enough -- no rebuild required.

import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const pdfPath = args.find((a) => !a.startsWith("--"));
const outFlagIdx = args.indexOf("--out");
const outPath = resolve(
  __dirname,
  "..",
  outFlagIdx >= 0 ? args[outFlagIdx + 1] : "public/data/questions.json"
);

if (!pdfPath || !existsSync(pdfPath)) {
  console.error(
    "Usage: node scripts/parse-exam.mjs <path-to-pdf> [--out public/data/questions.json]"
  );
  process.exit(1);
}

function checkPoppler() {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
  } catch {
    console.error(
      "pdftotext was not found. Install poppler (macOS: `brew install poppler`, " +
        "Debian/Ubuntu: `apt-get install poppler-utils`) and try again."
    );
    process.exit(1);
  }
}
checkPoppler();

// pdftotext inserts a form-feed (\f) at every page break, and the source PDF
// prints exactly one detailed answer per page -- so nearly every question
// header sits right after a \f rather than a \n. Normalize to \n so a single
// set of line-based regexes can find every question.
const raw = execFileSync("pdftotext", [resolve(pdfPath), "-"], {
  maxBuffer: 1024 * 1024 * 64,
})
  .toString("utf8")
  .replace(/\f/g, "\n");

const flags = []; // { id, reason, detail }
function flag(id, reason, detail) {
  flags.push({ id, reason, detail });
}

// ---------------------------------------------------------------------------
// Domain map, pulled from the intro's "Domain X.0 - Name - NN%" lines.
// ---------------------------------------------------------------------------
const domainMap = new Map();
{
  const domainRe = /Domain (\d)\.0\s*-\s*(.+?)\s*-\s*\d+%/g;
  let m;
  while ((m = domainRe.exec(raw))) {
    domainMap.set(Number(m[1]), m[2].trim());
  }
}
if (domainMap.size === 0) {
  console.warn("Warning: no domain breakdown found; topic tags will be generic.");
}

// ---------------------------------------------------------------------------
// Strip running headers / bare page numbers that sit next to them. These are
// page-break artifacts from the PDF, not question content.
// ---------------------------------------------------------------------------
function stripPageBreaks(text) {
  return text
    .replace(/\n{1,}Practice Exam [ABC] - (Answers|Questions)\n+\d{1,4}\n+/g, "\n\n")
    .replace(/\n{1,}\d{1,4}\n+Practice Exam [ABC] - (Answers|Questions)\n+/g, "\n\n");
}

// ---------------------------------------------------------------------------
// Locate each exam's "Detailed Answers" section. Each exam's block (Performance-
// Based Questions, Multiple Choice Questions, Quick Answers, Detailed Answers)
// is fully self-contained, so the end of exam N's Detailed Answers is the start
// of exam N+1's whole block -- not exam N+1's own "Detailed Answers" heading,
// which sits much further into that next block.
// ---------------------------------------------------------------------------
const examLetters = ["A", "B", "C"];
const starts = [];
let searchFrom = 0;
for (const letter of examLetters) {
  const start = raw.indexOf(`Practice Exam ${letter}\nDetailed Answers\n`, searchFrom);
  if (start < 0) {
    console.error(`Could not find "Detailed Answers" section for Exam ${letter}.`);
    process.exit(1);
  }
  starts.push(start);
  searchFrom = start;
}
const sectionBounds = examLetters.map((letter, idx) => {
  const nextLetter = examLetters[idx + 1];
  const end = nextLetter
    ? raw.indexOf(`Practice Exam ${nextLetter}\n\nPerformance-Based Questions`, starts[idx])
    : raw.length;
  return { letter, start: starts[idx], end: end > 0 ? end : raw.length };
});

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------
function normalizeToken(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// The source occasionally restates a choice with a different word form
// ("Avoid" -> "Avoidance", "Disabling" -> "Disable"). Treat two tokens as
// the same word if they share a long common prefix, so those variants don't
// break the restatement/explanation split.
function tokensMatch(a, b) {
  if (a === b) return true;
  if (a.length < 3 || b.length < 3) return false;
  const shorter = Math.min(a.length, b.length);
  let common = 0;
  while (common < shorter && a[common] === b[common]) common++;
  return common / shorter >= 0.75;
}

// Consume tokens of `blob` starting at `startPos` that match `canonicalText`,
// returning the character offset right after the matched region. Used to
// separate a restated choice ("D. Source: ANY...") from the prose that
// follows it, without a delimiter to split on.
function consumeCanonical(blob, startPos, canonicalText) {
  const canonicalTokens = canonicalText
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
  const tokenRe = /\S+/g;
  tokenRe.lastIndex = startPos;
  let ci = 0;
  let lastEnd = startPos;
  let m;
  while (ci < canonicalTokens.length && (m = tokenRe.exec(blob))) {
    const tok = normalizeToken(m[0]);
    if (tok === "") continue;
    if (tokensMatch(tok, canonicalTokens[ci])) {
      ci++;
      lastEnd = m.index + m[0].length;
    } else {
      break;
    }
  }
  const confidence = canonicalTokens.length === 0 ? 1 : ci / canonicalTokens.length;
  return { end: lastEnd, confidence };
}

function cleanExplanation(text) {
  return text
    .replace(/^[\s,]*\band\b[\s,]*/i, "")
    .replace(/^[\s,.:;]+/, "")
    .trim();
}

function joinStemLines(lines) {
  const out = [];
  let current = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("•")) {
      if (current) out.push(current);
      current = line;
    } else {
      current = current ? current + " " + line : line;
    }
  }
  if (current) out.push(current);
  return out.join("\n");
}

const SELECT_WORDS = { TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6 };
function extractSelectCount(stem) {
  const m = stem.match(/Select (TWO|THREE|FOUR|FIVE|SIX)/i);
  if (!m) return 1;
  return SELECT_WORDS[m[1].toUpperCase()] ?? 1;
}

function fallbackExplanation(choiceText, correctText) {
  return (
    `This does not satisfy what the scenario is asking for. The correct answer, ` +
    `"${correctText}", is the better fit; "${choiceText}" addresses a different ` +
    `concept or does not match the requirement described in the question.`
  );
}

// ---------------------------------------------------------------------------
// Parse a single question chunk (from "A6. " up to just before the next
// question header).
// ---------------------------------------------------------------------------
function parseQuestionChunk(examLetter, qid, chunk, domainMap) {
  const lines = chunk
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  // First line begins with "A6. " -- strip the numbering.
  const headerRe = new RegExp(`^${qid}\\.\\s*`);
  lines[0] = lines[0].replace(headerRe, "");

  const BULLET = "❍";
  const choiceLineRe = new RegExp(`^${BULLET}\\s*([A-Z])\\.\\s*(.*)$`);

  let i = 0;
  const stemLines = [];
  while (i < lines.length && !choiceLineRe.test(lines[i])) {
    stemLines.push(lines[i]);
    i++;
  }
  if (i >= lines.length) {
    flag(qid, "no-choices-found", "Could not locate answer choice markers.");
    return null;
  }

  // Choices: lines beginning with the bullet glyph + "A. text"
  const choiceOrder = [];
  const choicesMap = new Map();
  while (i < lines.length) {
    const m = lines[i].match(choiceLineRe);
    if (!m) break;
    const letter = m[1];
    let text = m[2];
    i++;
    while (i < lines.length && !/^The Answer/.test(lines[i]) && !choiceLineRe.test(lines[i])) {
      text += " " + lines[i];
      i++;
    }
    choiceOrder.push(letter);
    choicesMap.set(letter, text.trim());
  }

  if (i >= lines.length || !/^The Answer/.test(lines[i])) {
    flag(qid, "no-answer-marker", "Could not locate 'The Answer:' marker.");
    return null;
  }

  const answerStart = i;
  let incorrectStart = -1;
  let moreInfoStart = -1;
  for (let j = answerStart; j < lines.length; j++) {
    if (incorrectStart < 0 && /^The incorrect answers:?/.test(lines[j])) incorrectStart = j;
    if (/^More information:?/.test(lines[j])) {
      moreInfoStart = j;
      break;
    }
  }
  if (moreInfoStart < 0) moreInfoStart = lines.length;
  const answerEnd = incorrectStart >= 0 ? incorrectStart : moreInfoStart;

  const answerLines = lines.slice(answerStart, answerEnd);
  answerLines[0] = answerLines[0].replace(/^The Answers?:?\s*/, "");
  if (answerLines[0] === "") answerLines.shift();
  const answerBlob = answerLines.join(" ");

  // Find every "<letter>. " marker at a token boundary, restricted to blob start / after a comma / after "and".
  const markerRe = /(^|,\s*|\band\s+)([A-Z])\.\s/g;
  const correctMatches = [];
  let mm;
  while ((mm = markerRe.exec(answerBlob))) {
    const letter = mm[2];
    if (!choicesMap.has(letter)) continue;
    if (correctMatches.some((c) => c.letter === letter)) continue;
    correctMatches.push({ letter, index: mm.index + mm[0].length });
  }

  const expectedSelectCount = extractSelectCount(stemLines.join(" "));
  if (correctMatches.length === 0) {
    flag(qid, "no-correct-letter-found", "Could not identify correct answer letter(s).");
    return null;
  }
  if (correctMatches.length !== expectedSelectCount) {
    flag(
      qid,
      "select-count-mismatch",
      `Stem implies ${expectedSelectCount} correct choice(s), parser found ${correctMatches.length}.`
    );
  }

  const correctLetters = correctMatches.map((c) => c.letter);
  const last = correctMatches[correctMatches.length - 1];
  const lastCanonical = choicesMap.get(last.letter);
  const { end: correctExplStart, confidence } = consumeCanonical(answerBlob, last.index, lastCanonical);
  if (confidence < 0.6) {
    flag(qid, "low-confidence-answer-split", `Only matched ${Math.round(confidence * 100)}% of choice ${last.letter}'s text before assuming explanation start.`);
  }
  const correctExplanation = cleanExplanation(answerBlob.slice(correctExplStart));

  // Incorrect answers: positional correspondence handles source typos in the
  // restated letter (see README) -- the Nth marker maps to the Nth expected
  // (ascending) incorrect letter regardless of what character is printed.
  const explanations = new Map();
  for (const letter of correctLetters) {
    explanations.set(letter, correctExplanation || "This is the correct answer.");
  }

  const expectedIncorrect = choiceOrder.filter((l) => !correctLetters.includes(l));
  if (incorrectStart >= 0) {
    const incorrectLines = lines.slice(incorrectStart + 1, moreInfoStart);
    const incorrectBlob = incorrectLines.join(" ");
    const markers = [];
    const markerRe2 = /(^|\s)([A-Z])\.\s/g;
    let m2;
    while ((m2 = markerRe2.exec(incorrectBlob))) {
      markers.push({ letter: m2[2], matchStart: m2.index, textStart: m2.index + m2[0].length });
    }
    if (markers.length !== expectedIncorrect.length) {
      flag(
        qid,
        "incorrect-count-mismatch",
        `Expected ${expectedIncorrect.length} incorrect-answer entries, found ${markers.length}.`
      );
    }
    const n = Math.min(markers.length, expectedIncorrect.length);
    for (let k = 0; k < n; k++) {
      const expectedLetter = expectedIncorrect[k];
      const marker = markers[k];
      if (marker.letter !== expectedLetter) {
        flag(
          qid,
          "letter-typo-corrected",
          `Source printed "${marker.letter}." where choice "${expectedLetter}" was expected; matched by position.`
        );
      }
      const segEnd = k + 1 < markers.length ? markers[k + 1].matchStart : incorrectBlob.length;
      const canonical = choicesMap.get(expectedLetter);
      const { end, confidence: conf2 } = consumeCanonical(incorrectBlob, marker.textStart, canonical);
      let expl = cleanExplanation(incorrectBlob.slice(end, segEnd > end ? segEnd : undefined));
      if (conf2 < 0.6) {
        flag(qid, "low-confidence-incorrect-split", `Choice ${expectedLetter}: only matched ${Math.round(conf2 * 100)}% of its text.`);
      }
      if (!expl) {
        expl = fallbackExplanation(canonical, choicesMap.get(correctLetters[0]));
        flag(qid, "generated-fallback-explanation", `No explanation text found for choice ${expectedLetter}; generated a fallback.`);
      }
      explanations.set(expectedLetter, expl);
    }
    for (let k = n; k < expectedIncorrect.length; k++) {
      const letter = expectedIncorrect[k];
      explanations.set(letter, fallbackExplanation(choicesMap.get(letter), choicesMap.get(correctLetters[0])));
      flag(qid, "generated-fallback-explanation", `No explanation text found for choice ${letter}; generated a fallback.`);
    }
  } else {
    for (const letter of expectedIncorrect) {
      explanations.set(letter, fallbackExplanation(choicesMap.get(letter), choicesMap.get(correctLetters[0])));
      flag(qid, "generated-fallback-explanation", `No "incorrect answers" section found; generated a fallback for choice ${letter}.`);
    }
  }

  // Reference (objective + video link)
  let reference = null;
  let objective = null;
  if (moreInfoStart < lines.length) {
    // Usually "SY0-701, Objective X.X - Title" and the URL are on one line
    // each, but the topic title occasionally wraps onto its own line before
    // the URL -- join every line up to the URL into one objective line.
    const refLines = lines.slice(moreInfoStart + 1, moreInfoStart + 4);
    const urlIdx = refLines.findIndex((l) => /^https?:\/\//.test(l));
    const urlLine = urlIdx >= 0 ? refLines[urlIdx] : null;
    const objLine = (urlIdx >= 0 ? refLines.slice(0, urlIdx) : refLines.slice(0, 1)).join(" ").trim();
    if (/^SY0-\d{3}/.test(objLine)) {
      objective = objLine
        .replace(/^SY0-\d{3},\s*Objective\s*/, "")
        .replace(/^(\d+\.\d+)\s*-?\s*/, "$1 - ");
      if (!/^SY0-701/.test(objLine)) {
        flag(qid, "objective-exam-code-typo", `Reference line printed "${objLine.split(",")[0]}" instead of "SY0-701".`);
      }
      if (urlLine) reference = { label: objLine, url: urlLine };
    }
  }
  if (!objective) {
    flag(qid, "no-objective-found", "Could not locate the 'SY0-701, Objective ...' reference line.");
  }

  const domainNumber = objective ? Number(objective.split(".")[0]) : null;
  const domain = domainNumber && domainMap.has(domainNumber)
    ? { number: domainNumber, name: domainMap.get(domainNumber) }
    : { number: 0, name: "General" };

  const stem = joinStemLines(stemLines).replace(/\s*\(?Select (TWO|THREE|FOUR|FIVE|SIX)\)?\.?\s*$/i, "").trim();

  const choices = choiceOrder.map((letter) => ({
    letter,
    text: choicesMap.get(letter),
    correct: correctLetters.includes(letter),
    explanation: explanations.get(letter) || fallbackExplanation(choicesMap.get(letter), choicesMap.get(correctLetters[0])),
  }));

  return {
    id: qid,
    exam: examLetter,
    number: Number(qid.slice(1)),
    domain,
    objective,
    stem,
    selectCount: expectedSelectCount,
    choices,
    reference,
  };
}

// ---------------------------------------------------------------------------
// Run the parse across all three exams.
// ---------------------------------------------------------------------------
const allQuestions = [];
for (const { letter, start, end } of sectionBounds) {
  const sectionText = stripPageBreaks(raw.slice(start, end));

  const headerRe = new RegExp(`(?:^|\\n)(${letter}\\d+)\\.\\s*[A-Z]`, "g");
  const questionStarts = [];
  let hm;
  while ((hm = headerRe.exec(sectionText))) {
    questionStarts.push({ idx: hm.index, qid: hm[1] });
  }

  for (let k = 0; k < questionStarts.length; k++) {
    const chunkStart = questionStarts[k].idx;
    const chunkEnd = k + 1 < questionStarts.length ? questionStarts[k + 1].idx : sectionText.length;
    const chunk = sectionText.slice(chunkStart, chunkEnd);
    const q = parseQuestionChunk(letter, questionStarts[k].qid, chunk, domainMap);
    if (q) allQuestions.push(q);
  }
}

// A handful of choices in the source restate their wording differently
// between the choice list and the explanation (e.g. "block" vs "prevent",
// "disassociation" vs "deauthentication") closely enough that a human reader
// wouldn't notice, but not closely enough for consumeCanonical() to find the
// split cleanly -- it flags them (see review-flags.json) and falls back to
// including a short leftover word fragment at the start of the explanation.
// These are the two cases in this edition of the PDF; the fix is cosmetic
// (trims the fragment) and each entry is a no-op if the source text changes.
const KNOWN_EXPLANATION_ARTIFACTS = [
  {
    id: "A12",
    letter: "A",
    from: "prevent the use of removable media Removable media uses",
    to: "Removable media uses",
  },
  {
    id: "B13",
    letter: "B",
    from: "deauthentication Wireless deauthentication would cause",
    to: "Wireless deauthentication would cause",
  },
];
for (const fix of KNOWN_EXPLANATION_ARTIFACTS) {
  const q = allQuestions.find((question) => question.id === fix.id);
  const choice = q?.choices.find((c) => c.letter === fix.letter);
  if (choice?.explanation.startsWith(fix.from)) {
    choice.explanation = fix.to + choice.explanation.slice(fix.from.length);
  }
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(allQuestions, null, 2));

const flagsPath = resolve(dirname(outPath), "review-flags.json");
writeFileSync(flagsPath, JSON.stringify(flags, null, 2));

console.log(`Parsed ${allQuestions.length} questions -> ${outPath}`);
const byExam = examLetters.map((l) => `${l}: ${allQuestions.filter((q) => q.exam === l).length}`);
console.log(`  ${byExam.join("  ")}`);
console.log(`Review flags: ${flags.length} -> ${flagsPath}`);
if (flags.length > 0) {
  const byReason = {};
  for (const f of flags) byReason[f.reason] = (byReason[f.reason] || 0) + 1;
  for (const [reason, count] of Object.entries(byReason)) {
    console.log(`  ${reason}: ${count}`);
  }
}
