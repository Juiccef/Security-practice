import { useMemo, useState } from "react";
import type { Attempt, Domain, Question, SetupConfig } from "../lib/types";
import { domainsFromBank } from "../lib/questionBank";
import { filterBank } from "../lib/attempt";
import HistoryPanel from "../components/HistoryPanel";
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
    const config: SetupConfig = {
      mode,
      questionCount: effectiveCount,
      randomizeQuestions,
      randomizeChoices,
      domainFilter,
      timeLimitMinutes,
      passMarkPercent,
    };
    onStart(config);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.wordmark}>
          <span className={styles.wordmarkIcon} aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <path
                d="M16 3.5 26 7.5v9.1c0 7.2-4.4 12.4-10 15.1-5.6-2.7-10-7.9-10-15.1V7.5L16 3.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M11 16.4l3.2 3.2L21.4 12.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Console
        </div>
        <p className={styles.tagline}>Practice exam simulator for CompTIA Security+ SY0-701</p>
      </header>

      {savedInProgress && (
        <div className={styles.resumeBanner}>
          <div>
            <p className={styles.resumeLabel}>Exam in progress</p>
            <p className={styles.resumeDetail}>
              {savedInProgress.config.mode === "timed" ? "Timed exam" : "Practice mode"}, question{" "}
              {savedInProgress.currentIndex + 1} of {savedInProgress.questionIds.length}
            </p>
          </div>
          <div className={styles.resumeActions}>
            <button type="button" className={styles.ghostButton} onClick={onDiscardSaved}>
              Discard
            </button>
            <button type="button" className={styles.primaryButton} onClick={onResume}>
              Resume exam
            </button>
          </div>
        </div>
      )}

      <div className={styles.layout}>
        <form id="exam-setup-form" className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Mode</h2>
            <div className={styles.modeGrid}>
              <button
                type="button"
                className={`${styles.modeCard} ${mode === "practice" ? styles.modeCardActive : ""}`}
                onClick={() => setMode("practice")}
                aria-pressed={mode === "practice"}
              >
                <span className={styles.modeCardTitle}>Practice</span>
                <span className={styles.modeCardDesc}>
                  See whether each answer is right the moment you submit it, with an explanation
                  for every choice.
                </span>
              </button>
              <button
                type="button"
                className={`${styles.modeCard} ${mode === "timed" ? styles.modeCardActive : ""}`}
                onClick={() => setMode("timed")}
                aria-pressed={mode === "timed"}
              >
                <span className={styles.modeCardTitle}>Timed exam</span>
                <span className={styles.modeCardDesc}>
                  Feedback is withheld until you submit the full exam, just like the real thing.
                </span>
              </button>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Domains</h2>
            <p className={styles.sectionHint}>
              Leave every domain selected to draw from the full bank, or narrow it down to focus
              your review.
            </p>
            <div className={styles.domainList}>
              {domains.map((d) => (
                <DomainRow
                  key={d.number}
                  domain={d}
                  active={isDomainActive(d.number)}
                  count={bank.filter((q) => q.domain.number === d.number).length}
                  onToggle={() => toggleDomain(d.number)}
                />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Questions</h2>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel} htmlFor="questionCount">
                Number of questions
              </label>
              <div className={styles.stepper}>
                <input
                  id="questionCount"
                  type="range"
                  min={Math.min(10, poolSize)}
                  max={poolSize}
                  step={5}
                  value={effectiveCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                />
                <output className={`${styles.stepperValue} mono-figure`}>{effectiveCount}</output>
              </div>
            </div>
            <p className={styles.sectionHint}>{poolSize} questions available with this filter.</p>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
              />
              Randomize question order
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={randomizeChoices}
                onChange={(e) => setRandomizeChoices(e.target.checked)}
              />
              Randomize answer choice order
            </label>
          </section>

          {mode === "timed" && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Timing</h2>
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
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value) || DEFAULT_TIME_LIMIT)}
                />
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Scoring</h2>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel} htmlFor="passMark">
                Pass mark (%)
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
          </section>
        </form>

        <aside className={styles.ticket}>
          <div className={styles.ticketBody}>
            <p className={styles.ticketEyebrow}>Admission</p>
            <h3 className={styles.ticketTitle}>SY0-701 Practice Exam</h3>
            <dl className={styles.ticketRows}>
              <div className={styles.ticketRow}>
                <dt>Mode</dt>
                <dd>{mode === "timed" ? "Timed exam" : "Practice"}</dd>
              </div>
              <div className={styles.ticketRow}>
                <dt>Questions</dt>
                <dd className="mono-figure">{effectiveCount}</dd>
              </div>
              <div className={styles.ticketRow}>
                <dt>Time limit</dt>
                <dd className="mono-figure">{mode === "timed" ? `${timeLimitMinutes} min` : "None"}</dd>
              </div>
              <div className={styles.ticketRow}>
                <dt>Pass mark</dt>
                <dd className="mono-figure">{passMarkPercent}%</dd>
              </div>
              <div className={styles.ticketRow}>
                <dt>Domains</dt>
                <dd>{domainFilter === null ? "All" : `${domainFilter.length} selected`}</dd>
              </div>
            </dl>
          </div>
          <div className={styles.ticketStub}>
            <button
              type="submit"
              form="exam-setup-form"
              className={styles.beginButton}
              disabled={effectiveCount === 0}
            >
              Begin exam
            </button>
          </div>
        </aside>
      </div>

      <HistoryPanel bank={bank} history={history} onView={onViewHistoryAttempt} />
    </div>
  );
}

function DomainRow({
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
    <label className={styles.domainRow} data-active={active}>
      <input type="checkbox" checked={active} onChange={onToggle} />
      <span className={styles.domainName}>
        {domain.number}.0 {domain.name}
      </span>
      <span className={`${styles.domainCount} mono-figure`}>{count}</span>
    </label>
  );
}
