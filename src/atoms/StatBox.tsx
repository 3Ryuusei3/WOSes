interface StatBoxProps {
  label: string;
  value: string | number;
  valueClassName?: string;
  size?: "sm" | "md";
  /** Highlight the whole tile (good result / penalty) */
  tone?: "good" | "bad";
}

/** Dark tile: small label on top, big yellow number */
export default function StatBox({
  label,
  value,
  valueClassName = "",
  size = "md",
  tone,
}: StatBoxProps) {
  const sizeClass = size === "sm" ? "score__container--box-sm" : "";

  return (
    <div
      className={`score__container--box ${sizeClass} stat-box ${tone ? `stat-box--${tone}` : ""}`}
    >
      <p>{label}</p>
      <h3 className={valueClassName}>{value}</h3>
    </div>
  );
}
