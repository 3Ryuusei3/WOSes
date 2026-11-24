interface SegmentedTab<K extends string> {
  key: K;
  label: string;
  /** Extra class for this tab (e.g. its difficulty color) */
  className?: string;
}

interface SegmentedTabsProps<K extends string> {
  tabs: SegmentedTab<K>[];
  active: K;
  onChange: (key: K) => void;
  /** "sm": compact, for filters inside a section (e.g. ranking difficulty) */
  size?: "md" | "sm";
}

/**
 * Segmented control: switch between sections of a screen on mobile (e.g.
 * play / ranking instead of a modal) or filter a section (ranking difficulty).
 */
export default function SegmentedTabs<K extends string>({
  tabs,
  active,
  onChange,
  size = "md",
}: SegmentedTabsProps<K>) {
  return (
    <div
      className={`segmented-tabs ${size === "sm" ? "segmented-tabs--sm" : ""}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={tab.key === active}
          className={`segmented-tabs__tab ${tab.className ?? ""} ${tab.key === active ? "is-active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
