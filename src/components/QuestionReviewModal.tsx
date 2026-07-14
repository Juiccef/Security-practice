import { useEffect, useState } from "react";
import type { Attempt, Question } from "../lib/types";
import styles from "./QuestionReviewModal.module.css";

interface Props {
  questions: Question[];
  attempt: Attempt;
  currentIndex: number;
  onJump: (index: number) => void;
  onEndAndGrade: () => void;
  onClose: () => void;
}

type Filter = "all" | "unanswered" | "marked";

export default function QuestionReviewModal({
  questions,
  attempt,
  currentIndex,
  onJump,
  onEndAndGrade,
  onClose,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedIndex, setSelectedIndex] = useState<number>(currentIndex);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const rows = questions
    .map((q, index) => {
      const state = attempt.answers[q.id];
      return {
        index,
        question: q,
        answered: (state?.selected.length ?? 0) > 0,
        marked: state?.flagged ?? false,
      };
    })
    .filter((row) => {
      if (filter === "unanswered") return !row.answered;
      if (filter === "marked") return row.marked;
      return true;
    });

  const answeredCount = questions.filter((q) => (attempt.answers[q.id]?.selected.length ?? 0) > 0)
    .length;
  const markedCount = questions.filter((q) => attempt.answers[q.id]?.flagged).length;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="qr-title">
      <div className={styles.dialog}>
        <header className={styles.header}>
          <h2 id="qr-title" className={styles.title}>
            Question Review
          </h2>
          <div className={styles.filters} role="group" aria-label="Filter questions">
            <FilterButton label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterButton
              label="Unanswered"
              active={filter === "unanswered"}
              onClick={() => setFilter("unanswered")}
            />
            <FilterButton
              label="Marked"
              active={filter === "marked"}
              onClick={() => setFilter("marked")}
            />
          </div>
        </header>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col" className={styles.colItem}>Item</th>
                <th scope="col" className={styles.colAnswered}>Answered</th>
                <th scope="col" className={styles.colMarked}>Marked</th>
                <th scope="col">Question</th>
                <th scope="col" className={styles.colCategory}>Category</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    No questions match this filter.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.question.id}
                    className={styles.row}
                    data-selected={row.index === selectedIndex}
                    data-current={row.index === currentIndex}
                    onClick={() => setSelectedIndex(row.index)}
                    onDoubleClick={() => onJump(row.index)}
                  >
                    <td className={`${styles.colItem} mono-figure`}>{row.index + 1}</td>
                    <td className={styles.colAnswered}>
                      {row.answered ? "Yes" : <span className={styles.noAnswer}>No</span>}
                    </td>
                    <td className={styles.colMarked}>
                      {row.marked && (
                        <span className={styles.markedCheck} aria-label="Marked">
                          ✓
                        </span>
                      )}
                    </td>
                    <td className={styles.colQuestion}>{row.question.stem.split("\n")[0]}</td>
                    <td className={styles.colCategory}>
                      {row.question.domain.number}.0 {row.question.domain.name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.footer}>
          <span className={`${styles.counts} mono-figure`}>
            {answeredCount} answered / {questions.length - answeredCount} unanswered / {markedCount}{" "}
            marked
          </span>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => onJump(selectedIndex)}
            >
              Jump to selected question
            </button>
            <button type="button" className={styles.primaryButton} onClick={onEndAndGrade}>
              End and Grade Exam
            </button>
          </div>
        </footer>
      </div>
    </div>
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
