import { useTranslation } from "react-i18next";
import Mechanics from "../types/Mechanics";

interface WarningMessageProps {
  gameMechanics: Mechanics;
}

// Same order on every screen, so the chips don't jump between rounds
const CHIP_ORDER: (keyof Mechanics)[] = [
  "still",
  "dark",
  "fake",
  "hidden",
  "mirrored",
  "first",
];

/**
 * Round's mechanics as coloured chips in one line (short labels on phones).
 * Without mechanics: the "find anagrams" ribbon (hidden on phones).
 */
export default function WarningMessage({ gameMechanics }: WarningMessageProps) {
  const { t } = useTranslation();
  const active = CHIP_ORDER.filter((key) => gameMechanics[key]);

  if (active.length === 0) {
    return (
      <h4 className="warning-message warning-message--default">
        {t("warningMessage.findAnagrams")}
      </h4>
    );
  }

  return (
    <ul
      className="mechanic-chips"
      aria-label={t("warningMessage.warning").trim()}
    >
      {active.map((key) => (
        <li key={key} className={`mechanic-chip mechanic-chip--${key}`}>
          <span className="mechanic-chip__long">
            {t(`mechanicChips.${key}.long`)}
          </span>
          <span className="mechanic-chip__short" aria-hidden="true">
            {t(`mechanicChips.${key}.short`)}
          </span>
        </li>
      ))}
    </ul>
  );
}
