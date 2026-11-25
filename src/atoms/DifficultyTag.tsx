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
      className={`btn btn--deco btn--xs mx-auto difficulty-chip ${gameDifficulty === "easy" ? "btn--win" : gameDifficulty === "hard" ? "btn--lose" : gameDifficulty === "daily" ? "btn--daily" : ""}`}
    >
      {/* Full name, and a short one for tight spots (phones, see CSS) */}
      <span className="difficulty-tag__long">
        {t(`difficulties.${gameDifficulty}`)}{" "}
        {dailyChallengeOriginalDifficulty &&
          `(${t(`difficulties.${dailyChallengeOriginalDifficulty}`)})`}
      </span>
      <span className="difficulty-tag__short" aria-hidden="true">
        {t(`difficulties.short.${gameDifficulty}`)}
      </span>
    </button>
  );
}
