import type { AttemptQuestionState, Question } from "../lib/types";
import AnswerChoiceList from "./AnswerChoiceList";
import ExplanationPanel from "./ExplanationPanel";
import styles from "./QuestionCard.module.css";

interface Props {
  question: Question;
  state: AttemptQuestionState;
  showFeedback: boolean;
  onToggleChoice: (letter: string) => void;
}

export default function QuestionCard({ question, state, showFeedback, onToggleChoice }: Props) {
  return (
    <article className={styles.card}>
      <div className={styles.stem}>
        {question.stem.split("\n").map((line, i) =>
          line.startsWith("•") ? (
            <p key={i} className={styles.bulletLine}>
              {line}
            </p>
          ) : (
            <p key={i} className={styles.stemLine}>
              {line}
            </p>
          ),
        )}
      </div>

      <AnswerChoiceList
        question={question}
        state={state}
        showFeedback={showFeedback}
        onToggleChoice={onToggleChoice}
      />

      {showFeedback && <ExplanationPanel question={question} state={state} />}
    </article>
  );
}
