import { useMemo, useState } from "react";
import type { Attempt, Question } from "../lib/types";
import { isCorrect, missedQuestionIds, scoreAttempt } from "../lib/attempt";
import DomainBreakdown from "../components/DomainBreakdown";
import ReviewList from "../components/ReviewList";
import styles from "./ResultsScreen.module.css";

interface Props {
  bank: Question[];
  attempt: Attempt;
  onRetakeFull: () => void;
  onRetakeMissed: () => void;
  onNewAttempt: () => void;
}

export type ReviewFilter = "all" | "correct" | "incorrect" | "flagged";

export default function ResultsScreen({ bank, attempt, onRetakeFull, onRetakeMissed, onNewAttempt }: Props) {
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const score = useMemo(() => scoreAttempt(attempt, bank), [attempt, bank]);
  const missedIds = useMemo(() => missedQuestionIds(attempt, bank), [attempt, bank]);
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const filteredIds = attempt.questionIds.filter((qid) => {
    const question = byId.get(qid);
    const state = attempt.answers[qid];
    if (!question || !state) return false;
    if (filter === "correct") return isCorrect(question, state);
    if (filter === "incorrect") return !isCorrect(question, state);
    if (filter === "flagged") return state.flagged;
    return true;
  });

  const flaggedCount = attempt.questionIds.filter((qid) => attempt.answers[qid].flagged).length;

  return (
    <div className={styles.page}>
      <section className={styles.summaryCard}>
        <div className={styles.summaryTop}>
          <div>
            <p className={styles.eyebrow}>
              {attempt.config.mode === "timed" ? "Timed exam" : "Practice"} result
            </p>
            <h1 className={styles.scoreValue} data-passed={score.passed}>
              <span className="mono-figure">{score.scorePercent}</span>
              <span className={styles.scorePercentSign}>%</span>
            </h1>
            <p className={styles.scoreDetail}>
              <span className="mono-figure">{score.correctCount}</span> of{" "}
              <span className="mono-figure">{score.totalCount}</span> correct, pass mark{" "}
              <span className="mono-figure">{attempt.config.passMarkPercent}%</span>
            </p>
          </div>
          <div className={styles.stamp} data-passed={score.passed} aria-hidden="true">
            {score.passed ? "Pass" : "Fail"}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.ghostButton} onClick={onNewAttempt}>
            New attempt
          </button>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={onRetakeMissed}
            disabled={missedIds.length === 0}
          >
            Retake missed ({missedIds.length})
          </button>
          <button type="button" className={styles.primaryButton} onClick={onRetakeFull}>
            Retake full exam
          </button>
        </div>
      </section>

      <DomainBreakdown breakdown={score.domainBreakdown} />

      <section className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <h2 className={styles.reviewTitle}>Question review</h2>
          <div className={styles.filterRow} role="tablist" aria-label="Filter questions">
            <FilterButton label="All" count={attempt.questionIds.length} active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterButton label="Correct" count={score.correctCount} active={filter === "correct"} onClick={() => setFilter("correct")} />
            <FilterButton
              label="Incorrect"
              count={score.totalCount - score.correctCount}
              active={filter === "incorrect"}
              onClick={() => setFilter("incorrect")}
            />
            <FilterButton label="Flagged" count={flaggedCount} active={filter === "flagged"} onClick={() => setFilter("flagged")} />
          </div>
        </div>

        <ReviewList questionIds={filteredIds} bank={bank} attempt={attempt} />
      </section>
    </div>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={styles.filterButton} data-active={active} onClick={onClick} role="tab" aria-selected={active}>
      {label} <span className="mono-figure">{count}</span>
    </button>
  );
}
