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
      aria-label={`Ver información sobre ${mechanicInfo.label}`}
    >
      {mechanicInfo.label}
    </h4>
  );
}
