import type { DomainScore } from "../lib/types";
import styles from "./DomainBreakdown.module.css";

interface Props {
  breakdown: DomainScore[];
}

export default function DomainBreakdown({ breakdown }: Props) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Domain breakdown</h2>
      <div className={styles.rows}>
        {breakdown.map((d) => {
          const percent = d.total === 0 ? 0 : Math.round((d.correct / d.total) * 100);
          const tier = percent >= 80 ? "strong" : percent >= 60 ? "steady" : "weak";
          return (
            <div key={d.domain.number} className={styles.row}>
              <div className={styles.rowHead}>
                <span className={styles.domainName}>
                  {d.domain.number}.0 {d.domain.name}
                </span>
                <span className={styles.rowHeadRight}>
                  <span className={styles.tierLabel} data-tier={tier}>
                    {tier === "strong" ? "Strong" : tier === "steady" ? "Steady" : "Needs review"}
                  </span>
                  <span className={`${styles.fraction} mono-figure`}>
                    {d.correct}/{d.total}
                  </span>
                </span>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} data-tier={tier} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
