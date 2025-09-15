interface ProgressBarProps {
  timeLeft: number;
  percentage: number;
  RUNNING_OUT_OF_TIME_PERCENTAGE: number;
  SHOW_LETTERS_PERCENTAGE: number;
}

export default function ProgressBar({ timeLeft, percentage, RUNNING_OUT_OF_TIME_PERCENTAGE, SHOW_LETTERS_PERCENTAGE }: ProgressBarProps) {
  return (
    <div className="v-section">
      <div className="progress__time">{Math.floor(timeLeft / 1000)}s</div>
      <div
        className="progress__container"
        style={{
          '--remaining-percentage': `${Math.max(0, Math.min(100, percentage))}%`,
          '--clr-progress-color': percentage < RUNNING_OUT_OF_TIME_PERCENTAGE ? 'var(--clr-progress-late)' : percentage < SHOW_LETTERS_PERCENTAGE ? 'var(--clr-progress-mid)' : 'var(--clr-progress-on-time)'
        } as React.CSSProperties}
      >
      </div>
    </div>
  );
}
