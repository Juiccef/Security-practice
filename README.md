# Console: a Security+ practice exam simulator

A self-contained practice exam app for the CompTIA Security+ (SY0-701) certification, built to feel like the real testing experience: a question palette, a countdown timer in timed mode, answer flagging, and a results screen with a domain-by-domain breakdown.

The question bank is parsed once from a source PDF into a local JSON file. The app never touches the PDF at runtime, and dropping in a new JSON file is enough to change the question set, no rebuild required.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static `dist/` folder that can be hosted anywhere (no backend, no server-side code).

## Loading a new set of questions

The app reads its question bank from `public/data/questions.json` at runtime via `fetch`. To regenerate it from a PDF:

```bash
node scripts/parse-exam.mjs /path/to/exam.pdf
```

This requires [poppler](https://poppler.freedesktop.org/) for `pdftotext` (macOS: `brew install poppler`, Debian/Ubuntu: `apt-get install poppler-utils`).

The parser is written for the Professor Messer style layout this bank was sourced from: three exams, each with a "Detailed Answers" section that restates every question, names the correct choice(s), and explains every choice (both why the right answer is right and why each wrong answer is wrong). If your source PDF uses a different layout, `scripts/parse-exam.mjs` is the only file that needs to change; the app itself only ever reads the resulting JSON shape described below, so nothing in `src/` has to change.

### What the parser does

- Extracts, per question: id, exam, domain/objective tag, question stem, answer choices, which choice(s) are correct, and an explanation for every single choice, not just the correct one.
- Supports both explanation styles a source PDF might use: one shared explanation for the whole question, or a separate explanation per choice. If a choice has no explanation text at all, the parser generates a short factual fallback ("this does not satisfy what the scenario asks for...") rather than leaving it blank.
- When parsing is ambiguous (a mismatched answer letter, an answer restated with different wording than the choice list, a missing reference line, and so on) it does not guess silently. Every such case is logged to `public/data/review-flags.json` with the question id and a plain-language reason, for someone to spot-check. Out of 255 questions parsed from the bundled PDF, 4 were flagged this way, and all 4 turned out to be small typos in the source book itself (a mislabeled answer letter, a wrong exam code in one reference line) rather than parsing errors.
- Performance-based (drag-and-drop/matching) questions are intentionally out of scope: this app is a multiple-choice simulator, and those questions use a different interaction model. They're skipped and flagged as `no-choices-found` in the review log rather than silently dropped.

### JSON shape

```ts
interface Question {
  id: string; // "A6"
  exam: "A" | "B" | "C";
  number: number;
  domain: { number: number; name: string };
  objective: string | null; // "4.6 - Access Controls"
  stem: string;
  selectCount: number; // 1 for single-answer, 2+ for "choose N"
  choices: {
    letter: string;
    text: string;
    correct: boolean;
    explanation: string;
  }[];
  reference: { label: string; url: string } | null;
}
```

Drop a JSON file matching this shape at `public/data/questions.json` (plus, optionally, a `public/data/review-flags.json` if you want to track parsing caveats) and refresh the page.

## How the app is put together

- **Setup** (`src/screens/SetupScreen.tsx`): practice vs. timed mode, question count, domain filters, randomization, timer length, and pass mark. Also the home for resuming an in-progress attempt and browsing past results.
- **Exam** (`src/screens/ExamScreen.tsx`): the question palette, the question card with radio/checkbox choices, flagging, the countdown timer, and the pre-submit confirmation.
- **Results** (`src/screens/ResultsScreen.tsx`): score, pass/fail, a domain breakdown, and a filterable, expandable review of every question.

Question bank and grading logic live in `src/lib/` and know nothing about React; the screens and components in `src/screens/` and `src/components/` know nothing about how the bank was parsed. That split is what lets a new PDF or JSON file replace the question set without touching UI code.

Progress is saved to `localStorage` after every answer, so an in-progress attempt survives a page reload, and a short history of past attempts is kept for reviewing scores over time.

## Design system

The visual language is meant to evoke a security operations console rather than a generic quiz app: a graphite (not flat-black) surface, a muted structural blue for interactive chrome, and four saturated colors reserved strictly for meaning, correct, incorrect, flagged, and "this is the question you're on now". Question numbers, the timer, and scores use IBM Plex Mono with tabular figures; headings and the wordmark use Fraunces; body and interface text use IBM Plex Sans. Tokens are defined once in `src/styles/tokens.css`.

## Keyboard support

- Arrow Left / Right: previous / next question
- Number keys or letter keys (1-9, A-H): select the answer choice in that position
- F: flag the current question for review
- Esc: close the submit confirmation dialog
