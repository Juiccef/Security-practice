import { useMemo, useState } from "react";
import type { Attempt, Question } from "../lib/types";
import { isCorrect, missedQuestionIds, scoreAttempt } from "../lib/attempt";
import CategoryBreakdown from "../components/CategoryBreakdown";
import ReviewList from "../components/ReviewList";
import ThemeToggle from "../components/ThemeToggle";
import styles from "./ResultsScreen.module.css";

interface Props {
  bank: Question[];
  attempt: Attempt;
  onRetakeFull: () => void;
  onRetakeMissed: () => void;
  onNewAttempt: () => void;
}

type Tab = "overall" | "categories" | "questions" | "references";
type ReviewFilter = "all" | "correct" | "incorrect" | "marked";

export default function ResultsScreen({
  bank,
  attempt,
  onRetakeFull,
  onRetakeMissed,
  onNewAttempt,
}: Props) {
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const score = useMemo(() => scoreAttempt(attempt, bank), [attempt, bank]);
  const missedIds = useMemo(() => missedQuestionIds(attempt, bank), [attempt, bank]);
  const [tab, setTab] = useState<Tab>("overall");
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const filteredIds = attempt.questionIds.filter((qid) => {
    const question = byId.get(qid);
    const state = attempt.answers[qid];
    if (!question || !state) return false;
    if (filter === "correct") return isCorrect(question, state);
    if (filter === "incorrect") return !isCorrect(question, state);
    if (filter === "marked") return state.flagged;
    return true;
  });

  const markedCount = attempt.questionIds.filter((qid) => attempt.answers[qid].flagged).length;
  const passMark = attempt.config.passMarkPercent;

  return (
    <div className={styles.page}>
      <header className={styles.titleBar}>
        <h1 className={styles.title}>
          Exam Results: Security+ SY0-701 {attempt.config.mode === "timed" ? "Simulation" : "Study"}{" "}
          Exam
        </h1>
        <ThemeToggle />
      </header>

      <div className={styles.tabStrip} role="tablist" aria-label="Result views">
        <TabButton label="Overall" active={tab === "overall"} onClick={() => setTab("overall")} />
        <TabButton
          label="Category Breakdown"
          active={tab === "categories"}
          onClick={() => setTab("categories")}
        />
        <TabButton
          label="Question Review"
          active={tab === "questions"}
          onClick={() => setTab("questions")}
        />
        <TabButton
          label="References"
          active={tab === "references"}
          onClick={() => setTab("references")}
        />
      </div>

      <main className={styles.panel}>
        {tab === "overall" && (
          <section aria-label="Overall result" className={styles.overall}>
            <div className={styles.resultHeader}>
              <p className={styles.resultLine}>
                Exam Result:{" "}
                <span className={styles.resultVerdict} data-passed={score.passed}>
                  {score.passed ? "Pass" : "Fail"}
                </span>
              </p>
              <p className={styles.scoreLine}>
                Your Score: <span className="mono-figure">{score.scorePercent}%</span>
              </p>
              <p className={styles.passLine}>
                Passing Score: <span className="mono-figure">{passMark}%</span>
              </p>
              <p className={styles.countLine}>
                <span className="mono-figure">{score.correctCount}</span> of{" "}
                <span className="mono-figure">{score.totalCount}</span> questions answered correctly
              </p>
            </div>

            <div
              className={styles.overallTrack}
              role="img"
              aria-label={`Overall score ${score.scorePercent}%, passing score ${passMark}%`}
            >
              <div className={styles.fillCorrect} style={{ width: `${score.scorePercent}%` }} />
              <div
                className={styles.fillIncorrect}
                style={{ width: `${100 - score.scorePercent}%` }}
              />
              <div className={styles.passMarker} style={{ left: `${passMark}%` }} />
            </div>
            <div className={styles.axis} aria-hidden="true">
              {Array.from({ length: 11 }, (_, i) => (
                <span key={i} className={`${styles.tick} mono-figure`}>
                  {i * 10}
                </span>
              ))}
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={onNewAttempt}>
                New Attempt
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onRetakeMissed}
                disabled={missedIds.length === 0}
              >
                Retake Missed ({missedIds.length})
              </button>
              <button type="button" className={styles.primaryButton} onClick={onRetakeFull}>
                Retake Full Exam
              </button>
            </div>
          </section>
        )}

        {tab === "categories" && (
          <section aria-label="Category breakdown">
            <CategoryBreakdown breakdown={score.domainBreakdown} passMarkPercent={passMark} />
          </section>
        )}

        {tab === "questions" && (
          <section aria-label="Question review" className={styles.questionsTab}>
            <div className={styles.filterRow} role="group" aria-label="Filter questions">
              <FilterButton
                label={`All (${attempt.questionIds.length})`}
                active={filter === "all"}
                onClick={() => setFilter("all")}
              />
              <FilterButton
                label={`Correct (${score.correctCount})`}
                active={filter === "correct"}
                onClick={() => setFilter("correct")}
              />
              <FilterButton
                label={`Incorrect (${score.totalCount - score.correctCount})`}
                active={filter === "incorrect"}
                onClick={() => setFilter("incorrect")}
              />
              <FilterButton
                label={`Marked (${markedCount})`}
                active={filter === "marked"}
                onClick={() => setFilter("marked")}
              />
            </div>
            <ReviewList questionIds={filteredIds} bank={bank} attempt={attempt} />
          </section>
        )}

        {tab === "references" && (
          <section aria-label="References" className={styles.referencesTab}>
            <p className={styles.referencesLead}>
              Study links for every question in this exam, in exam order.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.refTable}>
                <thead>
                  <tr>
                    <th scope="col" className={styles.refColItem}>Item</th>
                    <th scope="col">Reference</th>
                    <th scope="col" className={styles.refColCategory}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {attempt.questionIds.map((qid, i) => {
                    const question = byId.get(qid);
                    if (!question?.reference) return null;
                    return (
                      <tr key={qid}>
                        <td className={`${styles.refColItem} mono-figure`}>{i + 1}</td>
                        <td>
                          <a href={question.reference.url} target="_blank" rel="noreferrer">
                            {question.reference.label}
                          </a>
                        </td>
                        <td className={styles.refColCategory}>
                          {question.domain.number}.0 {question.domain.name}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={styles.tab}
      data-active={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={styles.filterButton} data-active={active} onClick={onClick}>
      {label}
    </button>
  );
}
