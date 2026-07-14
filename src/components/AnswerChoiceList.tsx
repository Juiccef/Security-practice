import type { AttemptQuestionState, Question } from "../lib/types";
import styles from "./AnswerChoiceList.module.css";

interface Props {
  question: Question;
  state: AttemptQuestionState;
  showFeedback: boolean;
  onToggleChoice: (letter: string) => void;
  disabled?: boolean;
}

export default function AnswerChoiceList({
  question,
  state,
  showFeedback,
  onToggleChoice,
  disabled,
}: Props) {
  const isMulti = question.selectCount > 1;
  const choiceMap = new Map(question.choices.map((c) => [c.letter, c]));

  return (
    <ul className={styles.list}>
      {state.choiceOrder.map((letter, i) => {
        const choice = choiceMap.get(letter);
        if (!choice) return null;
        const selected = state.selected.includes(letter);
        const status = !showFeedback
          ? "none"
          : choice.correct && selected
            ? "correct-selected"
            : choice.correct && !selected
              ? "correct-missed"
              : !choice.correct && selected
                ? "incorrect-selected"
                : "neutral";

        return (
          <li key={letter} className={styles.item}>
            <label className={styles.choiceRow} data-status={status} data-locked={showFeedback || disabled}>
              <span className={styles.control} aria-hidden="true">
                <input
                  type={isMulti ? "checkbox" : "radio"}
                  name={`question-${question.id}`}
                  checked={selected}
                  disabled={showFeedback || disabled}
                  onChange={() => onToggleChoice(letter)}
                  tabIndex={-1}
                />
                <span className={isMulti ? styles.checkbox : styles.radio} />
              </span>
              <span className={styles.letterBadge}>{String.fromCharCode(65 + i)}</span>
              <span className={styles.choiceText}>{choice.text}</span>
              {showFeedback && (
                <span className={styles.statusIcon} aria-hidden="true">
                  {status === "correct-selected" && <CheckIcon />}
                  {status === "correct-missed" && <CheckIcon muted />}
                  {status === "incorrect-selected" && <CrossIcon />}
                </span>
              )}
            </label>
            {showFeedback && (
              <p className={styles.explanation} data-status={status}>
                {choice.explanation}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CheckIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ opacity: muted ? 0.6 : 1 }}>
      <path
        d="M3 8.5 6.2 12 13 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
