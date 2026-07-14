import { useState } from "react";
import type { Attempt, Question } from "../lib/types";
import { isAnswered, isCorrect } from "../lib/attempt";
import AnswerChoiceList from "./AnswerChoiceList";
import styles from "./ReviewList.module.css";

interface Props {
  questionIds: string[];
  bank: Question[];
  attempt: Attempt;
}

export default function ReviewList({ questionIds, bank, attempt }: Props) {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const [openId, setOpenId] = useState<string | null>(questionIds[0] ?? null);

  if (questionIds.length === 0) {
    return <p className={styles.empty}>No questions match this filter.</p>;
  }

  return (
    <ul className={styles.list}>
      {questionIds.map((qid) => {
        const question = byId.get(qid);
        const state = attempt.answers[qid];
        if (!question || !state) return null;
        const correct = isCorrect(question, state);
        const answered = isAnswered(state);
        const isOpen = openId === qid;
        const overallIndex = attempt.questionIds.indexOf(qid);

        return (
          <li key={qid} className={styles.item}>
            <button
              type="button"
              className={styles.summaryRow}
              onClick={() => setOpenId(isOpen ? null : qid)}
              aria-expanded={isOpen}
            >
              <span className={`${styles.qNumber} mono-figure`}>{overallIndex + 1}</span>
              <span className={styles.statusDot} data-status={!answered ? "unanswered" : correct ? "correct" : "incorrect"} />
              <span className={styles.qStem}>{question.stem.split("\n")[0]}</span>
              {state.flagged && <span className={styles.flagBadge}>Flagged</span>}
              <span className={styles.chevron} data-open={isOpen} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div className={styles.detail}>
                <p className={styles.fullStem}>{question.stem}</p>
                {!answered && <p className={styles.unansweredNote}>You did not answer this question.</p>}
                <AnswerChoiceList question={question} state={state} showFeedback onToggleChoice={() => {}} disabled />
                {question.reference && (
                  <a
                    className={styles.referenceLink}
                    href={question.reference.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {question.reference.label}
                  </a>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
