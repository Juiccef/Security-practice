import type { Attempt, Question } from "../lib/types";
import styles from "./QuestionPalette.module.css";

interface Props {
  questions: Question[];
  attempt: Attempt;
  currentIndex: number;
  onJump: (index: number) => void;
}

export default function QuestionPalette({ questions, attempt, currentIndex, onJump }: Props) {
  const answeredCount = questions.filter((q) => attempt.answers[q.id]?.selected.length > 0).length;

  return (
    <div className={styles.palette}>
      <div className={styles.summary}>
        <span className={`${styles.summaryValue} mono-figure`}>{answeredCount}</span>
        <span className={styles.summaryLabel}>of {questions.length} answered</span>
      </div>

      <div className={styles.grid} role="list">
        {questions.map((q, i) => {
          const state = attempt.answers[q.id];
          const answered = (state?.selected.length ?? 0) > 0;
          const isCurrent = i === currentIndex;
          return (
            <button
              key={q.id}
              type="button"
              role="listitem"
              className={styles.cell}
              data-answered={answered}
              data-flagged={state?.flagged ?? false}
              data-current={isCurrent}
              onClick={() => onJump(i)}
              aria-current={isCurrent ? "true" : undefined}
              aria-label={`Question ${i + 1}${answered ? ", answered" : ", unanswered"}${
                state?.flagged ? ", flagged for review" : ""
              }`}
            >
              <span className="mono-figure">{i + 1}</span>
            </button>
          );
        })}
      </div>

      <ul className={styles.legend}>
        <li>
          <span className={`${styles.legendSwatch} ${styles.swatchAnswered}`} /> Answered
        </li>
        <li>
          <span className={`${styles.legendSwatch} ${styles.swatchUnanswered}`} /> Unanswered
        </li>
        <li>
          <span className={`${styles.legendSwatch} ${styles.swatchFlagged}`} /> Flagged
        </li>
        <li>
          <span className={`${styles.legendSwatch} ${styles.swatchCurrent}`} /> Current
        </li>
      </ul>
    </div>
  );
}
