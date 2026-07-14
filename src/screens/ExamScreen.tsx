import { useEffect, useState } from "react";
import type { Attempt, Question } from "../lib/types";
import { useAttemptController } from "../hooks/useAttemptController";
import QuestionPalette from "../components/QuestionPalette";
import QuestionCard from "../components/QuestionCard";
import Timer from "../components/Timer";
import ConfirmSubmitModal from "../components/ConfirmSubmitModal";
import styles from "./ExamScreen.module.css";

interface Props {
  bank: Question[];
  attempt: Attempt;
  onUpdate: (attempt: Attempt) => void;
  onFinish: (attempt: Attempt) => void;
  onExit: () => void;
}

export default function ExamScreen({ bank, attempt, onUpdate, onFinish, onExit }: Props) {
  const controller = useAttemptController({ attempt, bank, onUpdate, onFinish });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const {
    questions,
    currentQuestion,
    currentState,
    currentIndex,
    goTo,
    next,
    prev,
    toggleChoice,
    toggleFlag,
    checkAnswer,
    finish,
    answeredCount,
    flaggedCount,
    unansweredCount,
    currentIsCorrect,
  } = controller;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key.toLowerCase() === "f") {
        toggleFlag();
      } else if (currentState && /^[1-9]$/.test(e.key)) {
        // Keyed by displayed position, not the underlying letter: choice
        // order is shuffled per attempt, so "B" must mean whatever choice is
        // currently drawn in the B slot, not choice.letter === "B".
        const idx = Number(e.key) - 1;
        const letter = currentState.choiceOrder[idx];
        if (letter) toggleChoice(letter);
      } else if (currentState && /^[a-hA-H]$/.test(e.key) && e.key.length === 1) {
        const idx = e.key.toUpperCase().charCodeAt(0) - 65;
        const letter = currentState.choiceOrder[idx];
        if (letter) toggleChoice(letter);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, toggleFlag, toggleChoice, currentState]);

  if (!currentQuestion || !currentState) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button type="button" className={styles.exitButton} onClick={onExit} aria-label="Exit to setup">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M9.5 3 5 8l4.5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Exit
          </button>
          <span className={styles.modeBadge} data-mode={attempt.config.mode}>
            {attempt.config.mode === "timed" ? "Timed exam" : "Practice"}
          </span>
        </div>

        <div className={styles.headerCenter}>
          <span className={`${styles.progress} mono-figure`}>
            Question {currentIndex + 1} <span className={styles.progressOf}>of {questions.length}</span>
          </span>
        </div>

        <div className={styles.headerRight}>
          {attempt.config.mode === "timed" && attempt.timeRemainingSeconds !== null && (
            <Timer secondsRemaining={attempt.timeRemainingSeconds} />
          )}
          <button
            type="button"
            className={styles.paletteToggle}
            onClick={() => setPaletteOpen((v) => !v)}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="none" stroke="currentColor" />
              <rect x="9" y="1" width="6" height="6" rx="1" fill="none" stroke="currentColor" />
              <rect x="1" y="9" width="6" height="6" rx="1" fill="none" stroke="currentColor" />
              <rect x="9" y="9" width="6" height="6" rx="1" fill="none" stroke="currentColor" />
            </svg>
            <span className={styles.hideOnCompact}>Questions</span>
          </button>
          <button type="button" className={styles.submitButton} onClick={() => setConfirmOpen(true)}>
            <span className={styles.hideOnCompact}>Submit exam</span>
            <span className={styles.showOnCompact}>Submit</span>
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={`${styles.paletteRail} ${paletteOpen ? styles.paletteRailOpen : ""}`}>
          <QuestionPalette
            questions={questions}
            attempt={attempt}
            currentIndex={currentIndex}
            onJump={(i) => {
              goTo(i);
              setPaletteOpen(false);
            }}
          />
        </aside>

        <main className={styles.main}>
          <QuestionCard
            question={currentQuestion}
            state={currentState}
            mode={attempt.config.mode}
            isCorrect={currentIsCorrect}
            onToggleChoice={toggleChoice}
            onToggleFlag={toggleFlag}
            onCheckAnswer={checkAnswer}
          />

          <nav className={styles.navBar}>
            <button
              type="button"
              className={styles.navButton}
              onClick={prev}
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <span className={styles.navHint}>
              Use the arrow keys to move, letter keys to choose, F to flag.
            </span>
            {currentIndex === questions.length - 1 ? (
              <button type="button" className={styles.navButtonPrimary} onClick={() => setConfirmOpen(true)}>
                Review and submit
              </button>
            ) : (
              <button type="button" className={styles.navButtonPrimary} onClick={next}>
                Next
              </button>
            )}
          </nav>
        </main>
      </div>

      {confirmOpen && (
        <ConfirmSubmitModal
          answeredCount={answeredCount}
          unansweredCount={unansweredCount}
          flaggedCount={flaggedCount}
          totalCount={questions.length}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={finish}
        />
      )}
    </div>
  );
}
