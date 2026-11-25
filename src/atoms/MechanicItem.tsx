import { useTranslation } from "react-i18next";
import { getMechanicInfo } from "../constant/mechanics";

interface MechanicItemProps {
  mechanicKey: string;
  onClick: (key: string) => void;
}

export default function MechanicItem({ mechanicKey, onClick }: MechanicItemProps) {
  const { t } = useTranslation();
  const mechanicInfo = getMechanicInfo(mechanicKey);

  if (!mechanicInfo) {
    return null;
  }

  return (
    <h4
      className={`mechanic-button mechanic-chip mechanic-chip--${mechanicKey}`}
      onClick={() => onClick(mechanicKey)}
      // Keyboard accessible: it opens the letter-type explanation
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick(mechanicKey);
        }
      }}
      aria-label={`Ver información sobre ${mechanicInfo.label}`}
    >
      {/* Phones: without "LETRA" (same short labels as in the game) */}
      <span className="mechanic-chip__long">{mechanicInfo.label}</span>
      <span className="mechanic-chip__short" aria-hidden="true">
        {t(`mechanicChips.${mechanicKey}.short`)}
      </span>
    </h4>
  );
}
