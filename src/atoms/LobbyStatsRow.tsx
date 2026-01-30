interface LobbyStatsRowProps {
  label: string;
  value: string | number;
  valueClassName?: string;
}

export default function LobbyStatsRow({
  label,
  value,
  valueClassName = "highlight",
}: LobbyStatsRowProps) {
  return (
    <div className="h-section gap-lg f-jc-sb f-ai-c">
      <p>{label}</p>
      <h4>
        <span className={valueClassName}>{value}</span>
      </h4>
    </div>
  );
}
