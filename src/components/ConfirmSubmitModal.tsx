import { useEffect, useRef } from "react";
import styles from "./ConfirmSubmitModal.module.css";

interface Props {
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
  totalCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmSubmitModal({
  answeredCount,
  unansweredCount,
  flaggedCount,
  totalCount,
  onCancel,
  onConfirm,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={styles.dialog}>
        <header className={styles.header}>
          <h2 id="confirm-title" className={styles.title}>
            End and Grade Exam
          </h2>
        </header>

        <div className={styles.body}>
          <p className={styles.lead}>
            Once graded, you cannot change your answers. Here is where things stand:
          </p>

          <table className={styles.statsTable}>
            <tbody>
              <tr>
                <th scope="row">Answered</th>
                <td className="mono-figure">{answeredCount}</td>
              </tr>
              <tr data-warn={unansweredCount > 0}>
                <th scope="row">Unanswered</th>
                <td className="mono-figure">{unansweredCount}</td>
              </tr>
              <tr>
                <th scope="row">Marked for review</th>
                <td className="mono-figure">{flaggedCount}</td>
              </tr>
              <tr>
                <th scope="row">Total</th>
                <td className="mono-figure">{totalCount}</td>
              </tr>
            </tbody>
          </table>

          {unansweredCount > 0 && (
            <p className={styles.warning}>
              {unansweredCount} unanswered question{unansweredCount === 1 ? "" : "s"} will be scored
              as incorrect.
            </p>
          )}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            Return to Exam
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onConfirm}
            ref={confirmRef}
          >
            End and Grade Exam
          </button>
        </footer>
      </div>
    </div>
  );
}
