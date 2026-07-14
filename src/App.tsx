import { useEffect, useMemo, useState } from "react";
import type { Attempt, Question, SetupConfig } from "./lib/types";
import { loadQuestionBank } from "./lib/questionBank";
import { loadCurrentAttempt, saveCurrentAttempt, loadHistory, appendToHistory } from "./lib/storage";
import { createAttempt, createRetakeAttempt, missedQuestionIds } from "./lib/attempt";
import SetupScreen from "./screens/SetupScreen";
import ExamScreen from "./screens/ExamScreen";
import ResultsScreen from "./screens/ResultsScreen";
import styles from "./App.module.css";

type View = "setup" | "exam" | "results";

export default function App() {
  const [bank, setBank] = useState<Question[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadCurrentAttempt());
  const [history, setHistory] = useState<Attempt[]>(() => loadHistory());
  const [view, setView] = useState<View>(() => {
    const saved = loadCurrentAttempt();
    if (saved?.status === "completed") return "results";
    return "setup";
  });

  useEffect(() => {
    loadQuestionBank()
      .then(setBank)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    saveCurrentAttempt(attempt);
  }, [attempt]);

  function handleStart(config: SetupConfig) {
    if (!bank) return;
    const next = createAttempt(bank, config);
    setAttempt(next);
    setView("exam");
  }

  function handleResume() {
    if (attempt?.status === "in-progress") setView("exam");
  }

  function handleAttemptUpdate(next: Attempt) {
    setAttempt(next);
  }

  function handleFinish(finished: Attempt) {
    setAttempt(finished);
    const nextHistory = [finished, ...history].slice(0, 50);
    setHistory(nextHistory);
    appendToHistory(finished);
    setView("results");
  }

  function handleExitToSetup() {
    setView("setup");
  }

  function handleNewAttempt() {
    setAttempt(null);
    saveCurrentAttempt(null);
    setView("setup");
  }

  function handleRetakeFull() {
    if (!bank || !attempt) return;
    const next = createRetakeAttempt(bank, attempt, attempt.questionIds);
    setAttempt(next);
    setView("exam");
  }

  function handleRetakeMissed() {
    if (!bank || !attempt) return;
    const missed = missedQuestionIds(attempt, bank);
    if (missed.length === 0) return;
    const next = createRetakeAttempt(bank, attempt, missed);
    setAttempt(next);
    setView("exam");
  }

  function handleViewHistoryAttempt(id: string) {
    const found = history.find((a) => a.id === id);
    if (found) {
      setAttempt(found);
      setView("results");
    }
  }

  const savedInProgress = useMemo(
    () => (attempt?.status === "in-progress" ? attempt : null),
    [attempt],
  );

  if (loadError) {
    return (
      <div className={styles.fatalError}>
        <h1>The question bank could not be loaded</h1>
        <p>{loadError}</p>
        <p>
          Run <code>node scripts/parse-exam.mjs &lt;path-to-pdf&gt;</code> to generate{" "}
          <code>public/data/questions.json</code>, then refresh this page.
        </p>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingMark} aria-hidden="true" />
        <p>Loading question bank...</p>
      </div>
    );
  }

  if (view === "exam" && attempt) {
    return (
      <ExamScreen
        bank={bank}
        attempt={attempt}
        onUpdate={handleAttemptUpdate}
        onFinish={handleFinish}
        onExit={handleExitToSetup}
      />
    );
  }

  if (view === "results" && attempt) {
    return (
      <ResultsScreen
        bank={bank}
        attempt={attempt}
        onRetakeFull={handleRetakeFull}
        onRetakeMissed={handleRetakeMissed}
        onNewAttempt={handleNewAttempt}
      />
    );
  }

  return (
    <SetupScreen
      bank={bank}
      onStart={handleStart}
      savedInProgress={savedInProgress}
      onResume={handleResume}
      onDiscardSaved={handleNewAttempt}
      history={history}
      onViewHistoryAttempt={handleViewHistoryAttempt}
    />
  );
}
