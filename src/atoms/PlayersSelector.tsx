import userIcon from "./../assets/user.svg";
import usersIcon from "./../assets/users.svg";

import Difficulty from "../types/Difficulty";

interface PlayersSelectorProps {
  players: string;
  setPlayers: (players: string) => void;
  enableMulti?: boolean;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export default function PlayersSelector({
  players,
  setPlayers,
  enableMulti = true,
  onDifficultyChange,
}: PlayersSelectorProps) {
  const handlePlayers = (players: string) => {
    setPlayers(players);
    if (players !== "single") {
      onDifficultyChange("easy");
    }
  };

  return (
    <div className="h-section gap-xs f-jc-c pos-rel w-fit mx-auto">
      <button
        className={`btn ${players === "single" ? "selected" : ""} btn--xs`}
        onClick={() => handlePlayers("single")}
      >
        <img src={userIcon} alt="user" className="player-selector" />
      </button>
      {enableMulti && (
        <button
          className={`btn ${players === "multi" ? "selected" : ""} btn--xs`}
          onClick={() => handlePlayers("multi")}
        >
          <img src={usersIcon} alt="users" className="player-selector" />
        </button>
      )}
    </div>
  );
}
