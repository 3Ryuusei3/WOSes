import { useTranslation } from "react-i18next";
import reloadIcon from "../assets/reload.svg";

interface ReconnectButtonProps {
  onClick: () => void;
  disabled: boolean;
  connectionStatus: string;
}

export default function ReconnectButton({
  onClick,
  disabled,
  connectionStatus,
}: ReconnectButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn--xs ${connectionStatus !== "connected" ? "btn--lose" : ""}`}
      title={
        connectionStatus !== "connected"
          ? "Reconectar"
          : "Actualizar estado"
      }
    >
      <span className="sr-only">{t("game.reconnect")}</span>
      <img src={reloadIcon} alt="reload" className="player-selector" />
    </button>
  );
}
