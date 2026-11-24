import { useTranslation } from "react-i18next";

import userIcon from "../assets/user.svg";
import useGameStore from "../store/useGameStore";

/**
 * Player button (icon only, like the sound one, in the opposite corner):
 * opens the name modal to change it.
 */
export default function UserBadge() {
  const { t } = useTranslation();
  const { playerName, setNameModalOpen } = useGameStore();
  const label = playerName
    ? `${t("gameStart.editName")}: ${playerName}`
    : t("gameStart.editName");

  return (
    <button
      type="button"
      className="user-control btn btn--sta btn--xs"
      onClick={() => setNameModalOpen(true)}
      aria-label={label}
      title={label}
    >
      <img src={userIcon} alt="" />
      <span className="user-control__name">
        {playerName || t("gameStart.yourName")}
      </span>
    </button>
  );
}
