interface StatBoxProps {
  label: string;
  value: string | number;
  valueClassName?: string;
  size?: "sm" | "md";
  /** Highlight the whole tile (good result / penalty) */
  tone?: "good" | "bad";
  /** What changed this level, shown small after the value: "+48", "−2s" */
  delta?: string;
  /** Colour of the tile's band and number (inside a .stat-grid) */
  accent?: "yellow" | "cyan" | "red" | "orange" | "green" | "white";
}

/** Dark tile: small label on top, big yellow number */
export default function StatBox({
  label,
  value,
  valueClassName = "",
  size = "md",
  tone,
  delta,
  accent,
}: StatBoxProps) {
  const sizeClass = size === "sm" ? "score__container--box-sm" : "";

  return (
    <div
      className={`score__container--box ${sizeClass} stat-box ${tone ? `stat-box--${tone}` : ""} ${accent ? `stat-box--${accent}` : ""}`}
    >
      <p>{label}</p>
      <h3 className={valueClassName}>
        {value}
        {delta && <small className="stat-delta">({delta})</small>}
      </h3>
    </div>
  );
}
