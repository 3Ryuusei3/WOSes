import { useState, type ReactNode } from "react";

interface ProgressBarProps {
  /** Shown at the left of the seconds row (e.g. the sound button on phones) */
  leading?: ReactNode;
  timeLeft: number;
  percentage: number;
  /** Round start (local ms) and length: the fill is a CSS animation */
  startedAt: number;
  durationMs: number;
  RUNNING_OUT_OF_TIME_PERCENTAGE: number;
  SHOW_LETTERS_PERCENTAGE: number;
}

export default function ProgressBar({
  leading,
  timeLeft,
  percentage,
  startedAt,
  durationMs,
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHOW_LETTERS_PERCENTAGE,
}: ProgressBarProps) {
  const time = <div className="progress__time">{Math.ceil(timeLeft / 1000)}s</div>;

  return (
    <div className="v-section">
      {leading ? (
        <div className="progress__label-row">
          {leading}
          {time}
        </div>
      ) : (
        time
      )}
      <div
        className="progress__container"
        style={
          {
            "--reveal-percentage": `${SHOW_LETTERS_PERCENTAGE}%`,
            "--clr-progress-color":
              percentage < RUNNING_OUT_OF_TIME_PERCENTAGE
                ? "var(--clr-progress-late)"
                : percentage < SHOW_LETTERS_PERCENTAGE
                  ? "var(--clr-progress-mid)"
                  : "var(--clr-progress-on-time)",
          } as React.CSSProperties
        }
      >
        <ProgressFill
          key={`${startedAt}-${durationMs}`}
          startedAt={startedAt}
          durationMs={durationMs}
        />
        <div className="progress__reveal-marker"></div>
      </div>
    </div>
  );
}

/**
 * The fill shrinks with a compositor-driven animation (transform), so it stays
 * smooth even while React or the keyboard keep the main thread busy. A
 * negative delay starts it already "elapsed" ms in (reloads, late joins,
 * multiplayer clock sync). The delay is frozen at mount — changing it later
 * would make the bar jump — and the parent remounts it via `key` when the
 * round's start or length changes.
 */
function ProgressFill({
  startedAt,
  durationMs,
}: {
  startedAt: number;
  durationMs: number;
}) {
  const [elapsed] = useState(() =>
    Math.min(durationMs, Math.max(0, Date.now() - startedAt)),
  );
  return (
    <div
      className="progress__fill"
      style={{
        animationDuration: `${durationMs}ms`,
        animationDelay: `-${elapsed}ms`,
      }}
    />
  );
}
