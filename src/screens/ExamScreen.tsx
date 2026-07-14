import { useEffect, useMemo, useState } from "react";
import type { Attempt, Question } from "../lib/types";
import { isCorrect } from "../lib/attempt";
import { useAttemptController } from "../hooks/useAttemptController";
import QuestionCard from "../components/QuestionCard";
import QuestionReviewModal from "../components/QuestionReviewModal";
import ConfirmSubmitModal from "../components/ConfirmSubmitModal";
import Timer from "../components/Timer";
import ThemeToggle from "../components/ThemeToggle";
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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
  } = controller;

  const isStudyMode = attempt.config.mode === "practice";
  const showRunningScore = isStudyMode && (attempt.config.showRunningScore ?? true);
  const showSelectCount = attempt.config.showSelectCount ?? true;

  const runningScore = useMemo(() => {
    if (!showRunningScore) return null;
    const byId = new Map(bank.map((q) => [q.id, q]));
    let submitted = 0;
    let correct = 0;
    for (const qid of attempt.questionIds) {
      const state = attempt.answers[qid];
      const question = byId.get(qid);
      if (!state?.submitted || !question) continue;
      submitted++;
      if (isCorrect(question, state)) correct++;
    }
    if (submitted === 0) return null;
    return Math.round((correct / submitted) * 100);
  }, [attempt, bank, showRunningScore]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (reviewOpen || confirmOpen) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key.toLowerCase() === "m") {
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
  }, [prev, next, toggleFlag, toggleChoice, currentState, reviewOpen, confirmOpen]);

  if (!currentQuestion || !currentState) return null;

  const showFeedback = isStudyMode && currentState.submitted;

  return (
    <div className={styles.page}>
      <header className={styles.titleBar}>
        <h1 className={styles.examTitle}>Security+ SY0-701 Practice Exam</h1>
        <div className={styles.titleBarRight}>
          <span className={styles.modeLabel}>
            {isStudyMode ? "Study Mode" : "Simulation Mode"}
          </span>
          <ThemeToggle />
          <button type="button" className={styles.exitButton} onClick={onExit}>
            Exit
          </button>
        </div>
      </header>

      <div className={styles.questionToolbar}>
        <span className={`${styles.itemCounter} mono-figure`}>
          Question {currentIndex + 1} of {questions.length}
        </span>
        {runningScore !== null && (
          <>
            <span className={styles.toolbarDivider} aria-hidden="true" />
            <span className={`${styles.runningScore} mono-figure`}>{runningScore}% correct</span>
          </>
        )}
        {showSelectCount && currentQuestion.selectCount > 1 && (
          <>
            <span className={styles.toolbarDivider} aria-hidden="true" />
            <span className={styles.selectHint}>
              Select the {currentQuestion.selectCount} best answers
            </span>
          </>
        )}
        <span className={styles.toolbarSpacer} />
        <label className={styles.markControl}>
          <input
            type="checkbox"
            checked={currentState.flagged}
            onChange={toggleFlag}
          />
          Mark for review
        </label>
        {attempt.config.mode === "timed" && attempt.timeRemainingSeconds !== null && (
          <>
            <span className={styles.toolbarDivider} aria-hidden="true" />
            <Timer secondsRemaining={attempt.timeRemainingSeconds} />
          </>
        )}
      </div>

      <main className={styles.content}>
        <QuestionCard
          question={currentQuestion}
          state={currentState}
          showFeedback={showFeedback}
          onToggleChoice={toggleChoice}
        />
      </main>

      <nav className={styles.examToolbar} aria-label="Exam navigation">
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={prev}
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={next}
            disabled={currentIndex === questions.length - 1}
          >
            Next
          </button>
          {isStudyMode && (
            <button
              type="button"
              className={styles.toolbarButton}
              onClick={checkAnswer}
              disabled={currentState.submitted}
            >
              Show Answer
            </button>
          )}
        </div>
        <span className={styles.keyHint}>
          Arrow keys move, letter keys choose, M marks for review.
        </span>
        <div className={styles.toolbarGroup}>
          <button type="button" className={styles.toolbarButton} onClick={() => setReviewOpen(true)}>
            Question Review
          </button>
          <button
            type="button"
            className={styles.toolbarButtonPrimary}
            onClick={() => setConfirmOpen(true)}
          >
            End and Grade
          </button>
        </div>
      </nav>

      {reviewOpen && (
        <QuestionReviewModal
          questions={questions}
          attempt={attempt}
          currentIndex={currentIndex}
          onJump={(i) => {
            goTo(i);
            setReviewOpen(false);
          }}
          onEndAndGrade={() => {
            setReviewOpen(false);
            setConfirmOpen(true);
          }}
          onClose={() => setReviewOpen(false)}
        />
      )}

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
