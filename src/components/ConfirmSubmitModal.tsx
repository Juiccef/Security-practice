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
      <div className={styles.modal}>
        <h2 id="confirm-title" className={styles.title}>
          Submit this exam?
        </h2>
        <p className={styles.body}>
          Once submitted, you cannot change your answers. Here is where things stand:
        </p>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Answered</dt>
            <dd className="mono-figure">{answeredCount}</dd>
          </div>
          <div className={styles.stat} data-warn={unansweredCount > 0}>
            <dt>Unanswered</dt>
            <dd className="mono-figure">{unansweredCount}</dd>
          </div>
          <div className={styles.stat} data-flag={flaggedCount > 0}>
            <dt>Flagged</dt>
            <dd className="mono-figure">{flaggedCount}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Total</dt>
            <dd className="mono-figure">{totalCount}</dd>
          </div>
        </dl>

        {unansweredCount > 0 && (
          <p className={styles.warning}>
            {unansweredCount} question{unansweredCount === 1 ? "" : "s"} still unanswered will be
            scored as incorrect.
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Keep reviewing
          </button>
          <button type="button" className={styles.confirmButton} onClick={onConfirm} ref={confirmRef}>
            Submit exam
          </button>
        </div>
      </div>
    </div>
  );
}
