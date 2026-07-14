import { useTheme } from "../hooks/useTheme";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const next = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === "light" ? (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M13.3 9.6A5.6 5.6 0 0 1 6.4 2.7a5.6 5.6 0 1 0 6.9 6.9Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M8 1.2v1.8M8 13v1.8M1.2 8H3M13 8h1.8M3.2 3.2l1.3 1.3M11.5 11.5l1.3 1.3M12.8 3.2l-1.3 1.3M4.5 11.5l-1.3 1.3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
