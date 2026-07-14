export type ExamLetter = "A" | "B" | "C";

export interface Choice {
  letter: string;
  text: string;
  correct: boolean;
  explanation: string;
}

export interface Domain {
  number: number;
  name: string;
}

export interface Reference {
  label: string;
  url: string;
}

export interface Question {
  id: string;
  exam: ExamLetter;
  number: number;
  domain: Domain;
  objective: string | null;
  stem: string;
  selectCount: number;
  choices: Choice[];
  reference: Reference | null;
}

export type ExamMode = "practice" | "timed";

export interface SetupConfig {
  mode: ExamMode;
  questionCount: number;
  randomizeQuestions: boolean;
  randomizeChoices: boolean;
  domainFilter: number[] | null;
  timeLimitMinutes: number;
  passMarkPercent: number;
  /* Boson-style study display options. Optional so attempts saved before
     these existed keep loading; read with `?? true`. */
  showRunningScore?: boolean;
  showSelectCount?: boolean;
}

export interface AttemptQuestionState {
  questionId: string;
  choiceOrder: string[];
  selected: string[];
  flagged: boolean;
  submitted: boolean;
}

export type AttemptStatus = "in-progress" | "completed";

export interface Attempt {
  id: string;
  config: SetupConfig;
  questionIds: string[];
  answers: Record<string, AttemptQuestionState>;
  currentIndex: number;
  startedAt: number;
  completedAt: number | null;
  timeRemainingSeconds: number | null;
  status: AttemptStatus;
  sourceAttemptId?: string;
}

export interface DomainScore {
  domain: Domain;
  correct: number;
  total: number;
}

export interface AttemptScore {
  correctCount: number;
  totalCount: number;
  answeredCount: number;
  scorePercent: number;
  passed: boolean;
  domainBreakdown: DomainScore[];
}
