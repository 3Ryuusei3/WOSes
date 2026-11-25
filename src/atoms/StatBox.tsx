interface StatBoxProps {
  label: string;
  value: string | number;
  valueClassName?: string;
  size?: "sm" | "md";
}

/** Dark tile: small label on top, big yellow number */
export default function StatBox({
  label,
  value,
  valueClassName = "",
  size = "md",
}: StatBoxProps) {
  const sizeClass = size === "sm" ? "score__container--box-sm" : "";

  return (
    <div className={`score__container--box ${sizeClass} stat-box`}>
      <p>{label}</p>
      <h3 className={valueClassName}>{value}</h3>
    </div>
  );
}
