import { useCallback, useEffect, useRef } from "react";
import type { Attempt, Question } from "../lib/types";
import { isCorrect } from "../lib/attempt";

interface Options {
  attempt: Attempt;
  bank: Question[];
  onUpdate: (attempt: Attempt) => void;
  onFinish: (attempt: Attempt) => void;
}

export function useAttemptController({ attempt, bank, onUpdate, onFinish }: Options) {
  const byId = useRef(new Map(bank.map((q) => [q.id, q])));
  byId.current = new Map(bank.map((q) => [q.id, q]));

  const questions = attempt.questionIds
    .map((id) => byId.current.get(id))
    .filter((q): q is Question => !!q);

  const currentQuestion = questions[attempt.currentIndex] ?? questions[0];
  const currentState = currentQuestion ? attempt.answers[currentQuestion.id] : undefined;

  const mutate = useCallback(
    (fn: (draft: Attempt) => void) => {
      const draft: Attempt = structuredClone(attempt);
      fn(draft);
      onUpdate(draft);
    },
    [attempt, onUpdate],
  );

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= attempt.questionIds.length) return;
      mutate((draft) => {
        draft.currentIndex = index;
      });
    },
    [attempt.questionIds.length, mutate],
  );

  const next = useCallback(() => goTo(attempt.currentIndex + 1), [attempt.currentIndex, goTo]);
  const prev = useCallback(() => goTo(attempt.currentIndex - 1), [attempt.currentIndex, goTo]);

  const toggleChoice = useCallback(
    (letter: string) => {
      if (!currentQuestion) return;
      mutate((draft) => {
        const state = draft.answers[currentQuestion.id];
        if (state.submitted) return;
        const isMulti = currentQuestion.selectCount > 1;
        if (isMulti) {
          state.selected = state.selected.includes(letter)
            ? state.selected.filter((l) => l !== letter)
            : [...state.selected, letter];
        } else {
          state.selected = state.selected.includes(letter) ? [] : [letter];
        }
      });
    },
    [currentQuestion, mutate],
  );

  const toggleFlag = useCallback(() => {
    if (!currentQuestion) return;
    mutate((draft) => {
      const state = draft.answers[currentQuestion.id];
      state.flagged = !state.flagged;
    });
  }, [currentQuestion, mutate]);

  const checkAnswer = useCallback(() => {
    if (!currentQuestion) return;
    mutate((draft) => {
      draft.answers[currentQuestion.id].submitted = true;
    });
  }, [currentQuestion, mutate]);

  const finish = useCallback(() => {
    const finished: Attempt = structuredClone(attempt);
    finished.status = "completed";
    finished.completedAt = Date.now();
    for (const qid of finished.questionIds) {
      finished.answers[qid].submitted = true;
    }
    onFinish(finished);
  }, [attempt, onFinish]);

  // Timer countdown for timed mode
  useEffect(() => {
    if (attempt.config.mode !== "timed" || attempt.timeRemainingSeconds === null) return;
    if (attempt.timeRemainingSeconds <= 0) {
      finish();
      return;
    }
    const interval = setInterval(() => {
      mutate((draft) => {
        if (draft.timeRemainingSeconds !== null) {
          draft.timeRemainingSeconds = Math.max(0, draft.timeRemainingSeconds - 1);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.timeRemainingSeconds, attempt.config.mode]);

  const answeredCount = attempt.questionIds.filter((qid) => attempt.answers[qid].selected.length > 0)
    .length;
  const flaggedCount = attempt.questionIds.filter((qid) => attempt.answers[qid].flagged).length;
  const unansweredCount = attempt.questionIds.length - answeredCount;

  const currentIsCorrect =
    currentQuestion && currentState?.submitted ? isCorrect(currentQuestion, currentState) : null;

  return {
    questions,
    currentQuestion,
    currentState,
    currentIndex: attempt.currentIndex,
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
  };
}
