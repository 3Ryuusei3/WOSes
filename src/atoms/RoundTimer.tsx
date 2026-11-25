import { useState } from "react";
import { useTranslation } from "react-i18next";

interface RoundTimerProps {
  timeLeft: number;
  /** Time left, 100 → 0 */
  percentage: number;
  /** Round start (local ms) and length: the ring is a CSS animation */
  startedAt: number;
  durationMs: number;
  RUNNING_OUT_OF_TIME_PERCENTAGE: number;
  /** When the hidden letters show up: the ring turns yellow */
  SHOW_LETTERS_PERCENTAGE: number;
  /** Phones: tapping the clock does what the back button does */
  onClick?: () => void;
  clickLabel?: string;
}

const R = 44;

/**
 * Round clock: a ring that empties clockwise around the seconds left. Cyan,
 * then yellow once the letters are revealed, pink at the end.
 */
export default function RoundTimer({
  timeLeft,
  percentage,
  startedAt,
  durationMs,
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHOW_LETTERS_PERCENTAGE,
  onClick,
  clickLabel,
}: RoundTimerProps) {
  const { t } = useTranslation();
  const seconds = Math.max(0, Math.ceil(timeLeft / 1000));
  const tone =
    percentage < RUNNING_OUT_OF_TIME_PERCENTAGE
      ? "late"
      : percentage < SHOW_LETTERS_PERCENTAGE
        ? "mid"
        : "ok";


  // Last 10 seconds: a beat every second (the key restarts the animation)
  // and a warning under the clock
  const urgent = seconds > 0 && seconds <= 10;

  return (
    <div
      className={`round-timer round-timer--${tone} ${urgent ? "round-timer--urgent" : ""} ${onClick ? "round-timer--button" : ""}`}
      role={onClick ? "button" : "timer"}
      aria-label={
        onClick && clickLabel
          ? `${clickLabel} · ${t("game.secondsLeft", { count: seconds })}`
          : t("game.secondsLeft", { count: seconds })
      }
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      // Don't close the device keyboard just by touching it
      onMouseDown={onClick ? (e) => e.preventDefault() : undefined}
    >
      <div className="round-timer__beat" key={urgent ? seconds : "calm"}>
      <svg className="round-timer__ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="round-timer__track" cx="50" cy="50" r={R} />
        <RingFill
          key={`${startedAt}-${durationMs}`}
          startedAt={startedAt}
          durationMs={durationMs}
        />
      </svg>
      <span className="round-timer__face">
        <span className="round-timer__secs">{seconds}</span>
        <small className="round-timer__unit">{t("game.secondsShort")}</small>
      </span>
      </div>
      {urgent && (
        <span className="round-timer__warning" role="status">
          {t("game.lastSecondsWarning")}
        </span>
      )}
    </div>
  );
}

/**
 * The ring empties with a CSS animation (not a React render per frame). A
 * negative delay starts it already "elapsed" ms in (reloads, late joins,
 * multiplayer clock sync); it is frozen at mount and the parent remounts it
 * via `key` when the round's start or length changes.
 */
function RingFill({
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
    <circle
      className="round-timer__fill"
      cx="50"
      cy="50"
      r={R}
      pathLength={100}
      style={{
        animationDuration: `${durationMs}ms`,
        animationDelay: `-${elapsed}ms`,
      }}
    />
  );
}
