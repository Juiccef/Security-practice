import { createId, shuffle } from "./random";
import type {
  Attempt,
  AttemptQuestionState,
  AttemptScore,
  Domain,
  DomainScore,
  Question,
  SetupConfig,
} from "./types";

export function filterBank(bank: Question[], config: SetupConfig): Question[] {
  return bank.filter((q) => {
    if (config.domainFilter && !config.domainFilter.includes(q.domain.number)) return false;
    return true;
  });
}

export function createAttempt(bank: Question[], config: SetupConfig): Attempt {
  const pool = filterBank(bank, config);
  const ordered = config.randomizeQuestions ? shuffle(pool) : pool;
  const selected = ordered.slice(0, Math.min(config.questionCount, ordered.length));

  const answers: Record<string, AttemptQuestionState> = {};
  for (const q of selected) {
    const letters = q.choices.map((c) => c.letter);
    answers[q.id] = {
      questionId: q.id,
      choiceOrder: config.randomizeChoices ? shuffle(letters) : letters,
      selected: [],
      flagged: false,
      submitted: false,
    };
  }

  return {
    id: createId(),
    config,
    questionIds: selected.map((q) => q.id),
    answers,
    currentIndex: 0,
    startedAt: Date.now(),
    completedAt: null,
    timeRemainingSeconds: config.mode === "timed" ? config.timeLimitMinutes * 60 : null,
    status: "in-progress",
  };
}

export function createRetakeAttempt(
  bank: Question[],
  baseAttempt: Attempt,
  questionIds: string[],
): Attempt {
  const config = baseAttempt.config;
  const byId = new Map(bank.map((q) => [q.id, q]));
  const selected = questionIds.map((id) => byId.get(id)).filter((q): q is Question => !!q);

  const answers: Record<string, AttemptQuestionState> = {};
  for (const q of selected) {
    const letters = q.choices.map((c) => c.letter);
    answers[q.id] = {
      questionId: q.id,
      choiceOrder: config.randomizeChoices ? shuffle(letters) : letters,
      selected: [],
      flagged: false,
      submitted: false,
    };
  }

  return {
    id: createId(),
    config,
    questionIds: selected.map((q) => q.id),
    answers,
    currentIndex: 0,
    startedAt: Date.now(),
    completedAt: null,
    timeRemainingSeconds: config.mode === "timed" ? config.timeLimitMinutes * 60 : null,
    status: "in-progress",
    sourceAttemptId: baseAttempt.id,
  };
}

export function isAnswered(state: AttemptQuestionState): boolean {
  return state.selected.length > 0;
}

export function isCorrect(question: Question, state: AttemptQuestionState): boolean {
  const correctLetters = question.choices.filter((c) => c.correct).map((c) => c.letter).sort();
  const chosen = [...state.selected].sort();
  return (
    correctLetters.length === chosen.length && correctLetters.every((l, i) => l === chosen[i])
  );
}

export function scoreAttempt(attempt: Attempt, bank: Question[]): AttemptScore {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const domainMap = new Map<number, DomainScore>();

  let correctCount = 0;
  let answeredCount = 0;

  for (const qid of attempt.questionIds) {
    const question = byId.get(qid);
    const state = attempt.answers[qid];
    if (!question || !state) continue;

    if (isAnswered(state)) answeredCount++;
    const correct = isCorrect(question, state);
    if (correct) correctCount++;

    const domain: Domain = question.domain;
    const entry = domainMap.get(domain.number) ?? { domain, correct: 0, total: 0 };
    entry.total++;
    if (correct) entry.correct++;
    domainMap.set(domain.number, entry);
  }

  const totalCount = attempt.questionIds.length;
  const scorePercent = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 1000) / 10;

  return {
    correctCount,
    totalCount,
    answeredCount,
    scorePercent,
    passed: scorePercent >= attempt.config.passMarkPercent,
    domainBreakdown: [...domainMap.values()].sort((a, b) => a.domain.number - b.domain.number),
  };
}

export function missedQuestionIds(attempt: Attempt, bank: Question[]): string[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  return attempt.questionIds.filter((qid) => {
    const question = byId.get(qid);
    const state = attempt.answers[qid];
    if (!question || !state) return false;
    return !isCorrect(question, state);
  });
}
