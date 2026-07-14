import type { Attempt } from "./types";

const CURRENT_KEY = "examconsole.v1.currentAttempt";
const HISTORY_KEY = "examconsole.v1.attempts";
const HISTORY_LIMIT = 50;

export function loadCurrentAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    return raw ? (JSON.parse(raw) as Attempt) : null;
  } catch {
    return null;
  }
}

export function saveCurrentAttempt(attempt: Attempt | null): void {
  try {
    if (attempt) {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(attempt));
    } else {
      localStorage.removeItem(CURRENT_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, quota) -- attempt still works in-memory for this session
  }
}

export function loadHistory(): Attempt[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Attempt[]) : [];
  } catch {
    return [];
  }
}

export function appendToHistory(attempt: Attempt): void {
  try {
    const history = loadHistory();
    history.unshift(attempt);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
