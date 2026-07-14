import type { AttemptQuestionState, ExamMode, Question } from "../lib/types";
import AnswerChoiceList from "./AnswerChoiceList";
import styles from "./QuestionCard.module.css";

interface Props {
  question: Question;
  state: AttemptQuestionState;
  mode: ExamMode;
  isCorrect: boolean | null;
  onToggleChoice: (letter: string) => void;
  onToggleFlag: () => void;
  onCheckAnswer: () => void;
}

export default function QuestionCard({
  question,
  state,
  mode,
  isCorrect,
  onToggleChoice,
  onToggleFlag,
  onCheckAnswer,
}: Props) {
  const showFeedback = mode === "practice" && state.submitted;
  const canCheck = mode === "practice" && !state.submitted && state.selected.length > 0;

  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <span className={styles.domainTag}>
          {question.domain.number}.0 {question.domain.name}
        </span>
        <button
          type="button"
          className={styles.flagButton}
          data-flagged={state.flagged}
          onClick={onToggleFlag}
          aria-pressed={state.flagged}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M4 2v12M4 2h7l-1.6 2.8L11 7.6H4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          {state.flagged ? "Flagged for review" : "Flag for review"}
        </button>
      </div>

      <div className={styles.stemRow}>
        <h1 className={styles.stem}>
          {question.stem.split("\n").map((line, i) =>
            line.startsWith("•") ? (
              <span key={i} className={styles.bulletLine}>
                {line}
              </span>
            ) : (
              <span key={i} className={styles.stemLine}>
                {line}
              </span>
            ),
          )}
        </h1>
        {question.selectCount > 1 && (
          <span className={styles.selectHint}>Choose {question.selectCount}</span>
        )}
      </div>

      <AnswerChoiceList
        question={question}
        state={state}
        showFeedback={showFeedback}
        onToggleChoice={onToggleChoice}
      />

      {mode === "practice" && (
        <div className={styles.practiceBar}>
          {!showFeedback ? (
            <button
              type="button"
              className={styles.checkButton}
              disabled={!canCheck}
              onClick={onCheckAnswer}
            >
              Check answer
            </button>
          ) : (
            <div className={styles.verdict} data-correct={isCorrect}>
              {isCorrect ? "Correct" : "Not quite"}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
