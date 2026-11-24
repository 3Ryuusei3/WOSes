import { getMechanicInfo } from "../constant/mechanics";

interface MechanicItemProps {
  mechanicKey: string;
  onClick: (key: string) => void;
}

export default function MechanicItem({ mechanicKey, onClick }: MechanicItemProps) {
  const mechanicInfo = getMechanicInfo(mechanicKey);

  if (!mechanicInfo) {
    return null;
  }

  return (
    <h4
      className={`mechanic-button ${mechanicInfo.cssClass}`}
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
      {mechanicInfo.label}
    </h4>
  );
}
