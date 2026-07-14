import { Fragment, useState } from "react";
import type { Attempt, Question } from "../lib/types";
import { isAnswered, isCorrect } from "../lib/attempt";
import AnswerChoiceList from "./AnswerChoiceList";
import ExplanationPanel from "./ExplanationPanel";
import styles from "./ReviewList.module.css";

interface Props {
  questionIds: string[];
  bank: Question[];
  attempt: Attempt;
}

export default function ReviewList({ questionIds, bank, attempt }: Props) {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const [openId, setOpenId] = useState<string | null>(null);

  if (questionIds.length === 0) {
    return <p className={styles.empty}>No questions match this filter.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.colItem}>Item</th>
            <th scope="col" className={styles.colScore}>Score</th>
            <th scope="col" className={styles.colMarked}>Marked</th>
            <th scope="col">Question</th>
            <th scope="col" className={styles.colCategory}>Category</th>
          </tr>
        </thead>
        <tbody>
          {questionIds.map((qid) => {
            const question = byId.get(qid);
            const state = attempt.answers[qid];
            if (!question || !state) return null;
            const answered = isAnswered(state);
            const correct = isCorrect(question, state);
            const isOpen = openId === qid;
            const overallIndex = attempt.questionIds.indexOf(qid);

            return (
              <Fragment key={qid}>
                <tr
                  className={styles.row}
                  data-open={isOpen}
                  onClick={() => setOpenId(isOpen ? null : qid)}
                  aria-expanded={isOpen}
                >
                  <td className={`${styles.colItem} mono-figure`}>{overallIndex + 1}</td>
                  <td className={styles.colScore}>
                    {!answered ? (
                      <span className={styles.scoreUnanswered}>Unanswered</span>
                    ) : correct ? (
                      <span className={styles.scoreCorrect}>Correct</span>
                    ) : (
                      <span className={styles.scoreIncorrect}>Incorrect</span>
                    )}
                  </td>
                  <td className={styles.colMarked}>
                    {state.flagged && (
                      <span className={styles.markedCheck} aria-label="Marked">
                        ✓
                      </span>
                    )}
                  </td>
                  <td className={styles.colQuestion}>{question.stem.split("\n")[0]}</td>
                  <td className={styles.colCategory}>
                    {question.domain.number}.0 {question.domain.name}
                  </td>
                </tr>
                {isOpen && (
                  <tr className={styles.detailRow}>
                    <td colSpan={5}>
                      <div className={styles.detail}>
                        <p className={styles.fullStem}>{question.stem}</p>
                        <AnswerChoiceList
                          question={question}
                          state={state}
                          showFeedback
                          onToggleChoice={() => {}}
                          disabled
                        />
                        <ExplanationPanel question={question} state={state} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
