import styles from "./Timer.module.css";

interface Props {
  secondsRemaining: number;
}

export default function Timer({ secondsRemaining }: Props) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const display = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const urgency = secondsRemaining <= 60 ? "critical" : secondsRemaining <= 300 ? "warning" : "normal";

  return (
    <div className={styles.timer} data-urgency={urgency} role="timer" aria-label="Time remaining">
      <span className={styles.label}>Time Remaining</span>
      <span className={`${styles.display} mono-figure`}>{display}</span>
    </div>
  );
}
