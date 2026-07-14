import { useMemo, useState } from "react";
import type { Attempt, Domain, Question, SetupConfig } from "../lib/types";
import { domainsFromBank } from "../lib/questionBank";
import { filterBank } from "../lib/attempt";
import HistoryPanel from "../components/HistoryPanel";
import ThemeToggle from "../components/ThemeToggle";
import styles from "./SetupScreen.module.css";

interface Props {
  bank: Question[];
  onStart: (config: SetupConfig) => void;
  savedInProgress: Attempt | null;
  onResume: () => void;
  onDiscardSaved: () => void;
  history: Attempt[];
  onViewHistoryAttempt: (id: string) => void;
}

const DEFAULT_TIME_LIMIT = 90;
const DEFAULT_PASS_MARK = 85;

export default function SetupScreen({
  bank,
  onStart,
  savedInProgress,
  onResume,
  onDiscardSaved,
  history,
  onViewHistoryAttempt,
}: Props) {
  const domains = useMemo(() => domainsFromBank(bank), [bank]);
  const [mode, setMode] = useState<SetupConfig["mode"]>("practice");
  const [domainFilter, setDomainFilter] = useState<number[] | null>(null);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeChoices, setRandomizeChoices] = useState(true);
  const [showRunningScore, setShowRunningScore] = useState(true);
  const [showSelectCount, setShowSelectCount] = useState(true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(DEFAULT_TIME_LIMIT);
  const [passMarkPercent, setPassMarkPercent] = useState(DEFAULT_PASS_MARK);

  const poolSize = useMemo(
    () => filterBank(bank, { domainFilter } as SetupConfig).length,
    [bank, domainFilter],
  );

  const [questionCount, setQuestionCount] = useState(90);
  const effectiveCount = Math.min(questionCount, poolSize);

  function toggleDomain(domainNumber: number) {
    setDomainFilter((current) => {
      const active = current ?? domains.map((d) => d.number);
      const next = active.includes(domainNumber)
        ? active.filter((n) => n !== domainNumber)
        : [...active, domainNumber];
      if (next.length === domains.length) return null;
      if (next.length === 0) return current;
      return next;
    });
  }

  const isDomainActive = (domainNumber: number) =>
    domainFilter === null || domainFilter.includes(domainNumber);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onStart({
      mode,
      questionCount: effectiveCount,
      randomizeQuestions,
      randomizeChoices,
      domainFilter,
      timeLimitMinutes,
      passMarkPercent,
      showRunningScore,
      showSelectCount,
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.titleBar}>
        <h1 className={styles.title}>Security+ SY0-701 Practice Exams</h1>
        <ThemeToggle />
      </header>

      <div className={styles.body}>
        {savedInProgress && (
          <div className={styles.resumeBanner}>
            <div>
              <p className={styles.resumeLabel}>Exam in progress</p>
              <p className={styles.resumeDetail}>
                {savedInProgress.config.mode === "timed" ? "Simulation Mode" : "Study Mode"},
                question {savedInProgress.currentIndex + 1} of {savedInProgress.questionIds.length}
              </p>
            </div>
            <div className={styles.resumeActions}>
              <button type="button" className={styles.secondaryButton} onClick={onDiscardSaved}>
                Discard
              </button>
              <button type="button" className={styles.primaryButton} onClick={onResume}>
                Resume Exam
              </button>
            </div>
          </div>
        )}

        <form className={styles.panel} onSubmit={handleSubmit}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Exam Mode</legend>
            <label className={styles.modeRow} data-active={mode === "practice"}>
              <input
                type="radio"
                name="mode"
                checked={mode === "practice"}
                onChange={() => setMode("practice")}
              />
              <span className={styles.modeText}>
                <span className={styles.modeName}>Study Mode</span>
                <span className={styles.modeDesc}>
                  View answers and explanations while you work through the exam. No forced time
                  limit.
                </span>
              </span>
            </label>
            <label className={styles.modeRow} data-active={mode === "timed"}>
              <input
                type="radio"
                name="mode"
                checked={mode === "timed"}
                onChange={() => setMode("timed")}
              />
              <span className={styles.modeText}>
                <span className={styles.modeName}>Simulation Mode</span>
                <span className={styles.modeDesc}>
                  Simulates the live exam: timed, with answers and explanations withheld until the
                  exam is graded.
                </span>
              </span>
            </label>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Questions</legend>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel} htmlFor="questionCount">
                Number of questions
              </label>
              <div className={styles.sliderGroup}>
                <input
                  id="questionCount"
                  type="range"
                  min={Math.min(10, poolSize)}
                  max={poolSize}
                  step={5}
                  value={effectiveCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                />
                <output className={`${styles.sliderValue} mono-figure`}>{effectiveCount}</output>
              </div>
            </div>
            <p className={styles.hint}>{poolSize} questions available with this category filter.</p>

            <div className={styles.categoryList}>
              {domains.map((d) => (
                <CategoryRow
                  key={d.number}
                  domain={d}
                  active={isDomainActive(d.number)}
                  count={bank.filter((q) => q.domain.number === d.number).length}
                  onToggle={() => toggleDomain(d.number)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Options</legend>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
              />
              Randomize question order
            </label>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={randomizeChoices}
                onChange={(e) => setRandomizeChoices(e.target.checked)}
              />
              Randomize answer order
            </label>
            <label className={styles.checkRow} data-disabled={mode !== "practice"}>
              <input
                type="checkbox"
                checked={showRunningScore}
                disabled={mode !== "practice"}
                onChange={(e) => setShowRunningScore(e.target.checked)}
              />
              Show current score during exam (Study Mode)
            </label>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={showSelectCount}
                onChange={(e) => setShowSelectCount(e.target.checked)}
              />
              Show the number of answers needed
            </label>

            {mode === "timed" && (
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel} htmlFor="timeLimit">
                  Time limit (minutes)
                </label>
                <input
                  id="timeLimit"
                  type="number"
                  className={styles.numberInput}
                  min={10}
                  max={240}
                  value={timeLimitMinutes}
                  onChange={(e) =>
                    setTimeLimitMinutes(Number(e.target.value) || DEFAULT_TIME_LIMIT)
                  }
                />
              </div>
            )}

            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel} htmlFor="passMark">
                Passing score (%)
              </label>
              <input
                id="passMark"
                type="number"
                className={styles.numberInput}
                min={50}
                max={100}
                value={passMarkPercent}
                onChange={(e) => setPassMarkPercent(Number(e.target.value) || DEFAULT_PASS_MARK)}
              />
            </div>
          </fieldset>

          <div className={styles.summaryBox}>
            <p className={styles.summaryTitle}>Current settings</p>
            <p className={styles.summaryText}>
              {mode === "timed" ? "Simulation Mode" : "Study Mode"} /{" "}
              <span className="mono-figure">{effectiveCount}</span> questions /{" "}
              {domainFilter === null ? "all categories" : `${domainFilter.length} categories`} /{" "}
              {mode === "timed" ? (
                <>
                  <span className="mono-figure">{timeLimitMinutes}</span> minute limit /{" "}
                </>
              ) : (
                "no time limit / "
              )}
              passing score <span className="mono-figure">{passMarkPercent}%</span>
            </p>
            <button type="submit" className={styles.beginButton} disabled={effectiveCount === 0}>
              Begin Exam
            </button>
          </div>
        </form>

        <HistoryPanel bank={bank} history={history} onView={onViewHistoryAttempt} />
      </div>
    </div>
  );
}

function CategoryRow({
  domain,
  active,
  count,
  onToggle,
}: {
  domain: Domain;
  active: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <label className={styles.categoryRow} data-active={active}>
      <input type="checkbox" checked={active} onChange={onToggle} />
      <span className={styles.categoryName}>
        {domain.number}.0 {domain.name}
      </span>
      <span className={`${styles.categoryCount} mono-figure`}>{count}</span>
    </label>
  );
}
