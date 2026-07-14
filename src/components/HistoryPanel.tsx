import type { Attempt, Question } from "../lib/types";
import { scoreAttempt } from "../lib/attempt";
import styles from "./HistoryPanel.module.css";

interface Props {
  bank: Question[];
  history: Attempt[];
  onView: (id: string) => void;
}

export default function HistoryPanel({ bank, history, onView }: Props) {
  const completed = history.filter((a) => a.status === "completed");

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Attempt history</h2>
      {completed.length === 0 ? (
        <p className={styles.empty}>
          Your past attempts will show up here once you finish an exam, so you can track your
          score over time.
        </p>
      ) : (
        <ul className={styles.list}>
          {completed.map((attempt) => (
            <HistoryRow
              key={attempt.id}
              attempt={attempt}
              bank={bank}
              onView={() => onView(attempt.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function HistoryRow({
  attempt,
  bank,
  onView,
}: {
  attempt: Attempt;
  bank: Question[];
  onView: () => void;
}) {
  const score = scoreAttempt(attempt, bank);
  const date = attempt.completedAt ? new Date(attempt.completedAt) : null;

  return (
    <li className={styles.row}>
      <button type="button" className={styles.rowButton} onClick={onView}>
        <span className={styles.rowMode}>
          {attempt.config.mode === "timed" ? "Timed" : "Practice"}
        </span>
        <span className={styles.rowDate}>
          {date
            ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
            : "In progress"}
        </span>
        <span className={`${styles.rowScore} mono-figure`} data-passed={score.passed}>
          {score.scorePercent}%
        </span>
        <span className={styles.rowVerdict} data-passed={score.passed}>
          {score.passed ? "Pass" : "Fail"}
        </span>
        <span className={`${styles.rowCount} mono-figure`}>
          {score.correctCount}/{score.totalCount}
        </span>
      </button>
    </li>
  );
}
