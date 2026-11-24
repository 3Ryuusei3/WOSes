import { useTranslation } from "react-i18next";

import userIcon from "./../assets/user.svg";
import usersIcon from "./../assets/users.svg";
import userPlusIcon from "./../assets/user-plus.svg";

import Difficulty from "../types/Difficulty";

/** single: play alone · multi: create a room (host) · join: enter a room code */
export type StartMode = "single" | "multi" | "join";

interface PlayersSelectorProps {
  mode: StartMode;
  onModeChange: (mode: StartMode) => void;
  enableMulti?: boolean;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export default function PlayersSelector({
  mode,
  onModeChange,
  enableMulti = true,
  onDifficultyChange,
}: PlayersSelectorProps) {
  const { t } = useTranslation();

  const select = (next: StartMode) => {
    onModeChange(next);
    // Rooms can't use the daily challenge
    if (next === "multi") onDifficultyChange("easy");
  };

  // Icons drawn with the text color (mask), so they match the label:
  // yellow when not selected, dark on the selected (yellow) option
  const icon = (src: string) => (
    <span
      className="players-selector__icon"
      // Quoted: small SVGs are inlined by Vite as data URLs with quotes and
      // spaces, which are invalid inside an unquoted url()
      style={{ "--icon": `url("${src}")` } as React.CSSProperties}
      aria-hidden="true"
    />
  );

  return (
    <div className="h-section gap-xs f-jc-c pos-rel w-fit mx-auto players-selector">
      <button
        type="button"
        className={`btn ${mode === "single" ? "selected" : ""} btn--xs`}
        onClick={() => select("single")}
      >
        {icon(userIcon)}
        <span className="players-selector__label">{t("players.single")}</span>
      </button>
      {enableMulti && (
        <>
          <button
            type="button"
            className={`btn ${mode === "multi" ? "selected" : ""} btn--xs`}
            onClick={() => select("multi")}
          >
            {icon(usersIcon)}
            <span className="players-selector__label">
              {t("players.createRoom")}
            </span>
          </button>
          <button
            type="button"
            className={`btn ${mode === "join" ? "selected" : ""} btn--xs`}
            onClick={() => select("join")}
          >
            {icon(userPlusIcon)}
            <span className="players-selector__label">{t("players.join")}</span>
          </button>
        </>
      )}
    </div>
  );
}
