import type { DomainScore } from "../lib/types";
import styles from "./CategoryBreakdown.module.css";

interface Props {
  breakdown: DomainScore[];
  passMarkPercent: number;
}

/* Boson-style category bars: green fill to the category score, red remainder,
   and a vertical pass-line marker on a shared 0-100 axis. */
export default function CategoryBreakdown({ breakdown, passMarkPercent }: Props) {
  return (
    <div className={styles.chart}>
      {breakdown.map((d) => {
        const percent = d.total === 0 ? 0 : Math.round((d.correct / d.total) * 100);
        return (
          <div key={d.domain.number} className={styles.row}>
            <span className={styles.label}>
              {d.domain.number}.0 {d.domain.name}
            </span>
            <div
              className={styles.track}
              role="img"
              aria-label={`${d.domain.name}: ${percent}% (${d.correct} of ${d.total} correct)`}
            >
              <div className={styles.fillCorrect} style={{ width: `${percent}%` }} />
              <div className={styles.fillIncorrect} style={{ width: `${100 - percent}%` }} />
              <div className={styles.passLine} style={{ left: `${passMarkPercent}%` }} />
            </div>
            <span className={`${styles.counts} mono-figure`}>
              {d.correct}/{d.total}
            </span>
          </div>
        );
      })}

      <div className={styles.axisRow}>
        <span className={styles.label} aria-hidden="true" />
        <div className={styles.axis} aria-hidden="true">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className={`${styles.tick} mono-figure`}>
              {i * 10}
            </span>
          ))}
        </div>
        <span className={styles.counts} aria-hidden="true" />
      </div>

      <p className={styles.legend}>
        <span className={styles.legendSwatchCorrect} /> Correct
        <span className={styles.legendSwatchIncorrect} /> Incorrect
        <span className={styles.legendPassLine} /> Passing score ({passMarkPercent}%)
      </p>
    </div>
  );
}
