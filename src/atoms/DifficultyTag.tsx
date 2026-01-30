import { useTranslation } from "react-i18next";

import Difficulty from "../types/Difficulty";

interface DifficultyTagProps {
  gameDifficulty: Difficulty;
  dailyChallengeOriginalDifficulty: Difficulty | null;
}

export default function DifficultyTag({
  gameDifficulty,
  dailyChallengeOriginalDifficulty,
}: DifficultyTagProps) {
  const { t } = useTranslation();

  return (
    <button
      className={`btn btn--deco btn--xs mx-auto ${gameDifficulty === "easy" ? "btn--win" : gameDifficulty === "hard" ? "btn--lose" : gameDifficulty === "daily" ? "btn--daily" : ""}`}
    >
      {t(`difficulties.${gameDifficulty}`)}{" "}
      {dailyChallengeOriginalDifficulty &&
        `(${t(`difficulties.${dailyChallengeOriginalDifficulty}`)})`}
    </button>
  );
}
