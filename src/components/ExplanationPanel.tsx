import type { AttemptQuestionState, Question } from "../lib/types";
import { isCorrect, isAnswered } from "../lib/attempt";
import styles from "./ExplanationPanel.module.css";

interface Props {
  question: Question;
  state: AttemptQuestionState;
}

/* Boson-style explanation block shown below the choices once the answer is
   revealed: verdict, "The correct answer is B.", the correct-answer
   explanation, then why each remaining choice is wrong, then the reference. */
export default function ExplanationPanel({ question, state }: Props) {
  const answered = isAnswered(state);
  const correct = isCorrect(question, state);

  // Display letters reflect the on-screen (possibly shuffled) positions.
  const displayLetter = (letter: string) => {
    const idx = state.choiceOrder.indexOf(letter);
    return idx >= 0 ? String.fromCharCode(65 + idx) : letter;
  };

  // List entries in on-screen order so the letters read A, B, C... downward.
  const byDisplay = (a: { letter: string }, b: { letter: string }) =>
    displayLetter(a.letter).localeCompare(displayLetter(b.letter));
  const correctChoices = question.choices.filter((c) => c.correct).sort(byDisplay);
  const incorrectChoices = question.choices.filter((c) => !c.correct).sort(byDisplay);

  const correctLetters = correctChoices
    .map((c) => displayLetter(c.letter))
    .sort();
  const answerSentence =
    correctLetters.length === 1
      ? `The correct answer is ${correctLetters[0]}.`
      : `The correct answers are ${correctLetters.slice(0, -1).join(", ")} and ${correctLetters[correctLetters.length - 1]}.`;

  return (
    <section className={styles.panel} aria-label="Explanation">
      <header className={styles.header}>
        <h2 className={styles.title}>Explanation</h2>
        {answered ? (
          <span className={styles.verdict} data-correct={correct}>
            {correct ? "Correct" : "Incorrect"}
          </span>
        ) : (
          <span className={styles.verdict} data-correct={false}>
            Not answered
          </span>
        )}
      </header>

      <p className={styles.answerLine}>{answerSentence}</p>

      {correctChoices.map((choice) => (
        <div key={choice.letter} className={styles.entry} data-kind="correct">
          <p className={styles.entryChoice}>
            <span className={`${styles.entryLetter} mono-figure`}>{displayLetter(choice.letter)}.</span>{" "}
            {choice.text}
          </p>
          <p className={styles.entryText}>{choice.explanation}</p>
        </div>
      ))}

      {incorrectChoices.length > 0 && (
        <p className={styles.incorrectHeading}>The incorrect answers:</p>
      )}

      {incorrectChoices.map((choice) => (
        <div key={choice.letter} className={styles.entry} data-kind="incorrect">
          <p className={styles.entryChoice}>
            <span className={`${styles.entryLetter} mono-figure`}>{displayLetter(choice.letter)}.</span>{" "}
            {choice.text}
          </p>
          <p className={styles.entryText}>{choice.explanation}</p>
        </div>
      ))}

      {question.reference && (
        <p className={styles.reference}>
          More information:{" "}
          <a href={question.reference.url} target="_blank" rel="noreferrer">
            {question.reference.label}
          </a>
        </p>
      )}
    </section>
  );
}
