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
      <h2 className={styles.title}>Attempt History</h2>
      {completed.length === 0 ? (
        <p className={styles.empty}>
          Your past attempts will show up here once you finish an exam, so you can track your score
          over time.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Mode</th>
                <th scope="col" className={styles.colNum}>Questions</th>
                <th scope="col" className={styles.colNum}>Score</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {completed.map((attempt) => {
                const score = scoreAttempt(attempt, bank);
                const date = attempt.completedAt ? new Date(attempt.completedAt) : null;
                return (
                  <tr key={attempt.id} className={styles.row} onClick={() => onView(attempt.id)}>
                    <td>
                      {date
                        ? date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                    </td>
                    <td>{attempt.config.mode === "timed" ? "Simulation" : "Study"}</td>
                    <td className={`${styles.colNum} mono-figure`}>
                      {score.correctCount}/{score.totalCount}
                    </td>
                    <td className={`${styles.colNum} mono-figure`}>{score.scorePercent}%</td>
                    <td>
                      <span className={styles.result} data-passed={score.passed}>
                        {score.passed ? "Pass" : "Fail"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
