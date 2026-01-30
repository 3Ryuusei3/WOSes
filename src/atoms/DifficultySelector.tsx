// New component: DifficultySelector.tsx
import { useTranslation } from "react-i18next";

import Difficulty from "../types/Difficulty";
import Tooltip from "./Tooltip";

interface DifficultySelectorProps {
  gameDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  showDailyChallenge?: boolean;
  onDailyChallengeClick?: () => void;
  loadingDaily?: boolean;
  isDailyChallengeSelected?: boolean;
}

export default function DifficultySelector({
  gameDifficulty,
  onDifficultyChange,
  showDailyChallenge = false,
  onDailyChallengeClick,
  loadingDaily = false,
  isDailyChallengeSelected = false,
}: DifficultySelectorProps) {
  const { t } = useTranslation();

  const handleDifficulty = (difficulty: Difficulty) => {
    onDifficultyChange(difficulty);
  };

  return (
    <div className="h-section gap-xs f-jc-c pos-rel w-fit mx-auto">
      <button
        className={`btn ${gameDifficulty === "easy" && !isDailyChallengeSelected ? "selected" : ""} btn--sm btn--win`}
        onClick={() => handleDifficulty("easy")}
      >
        {t("difficulties.easy")}
      </button>
      <button
        className={`btn ${gameDifficulty === "medium" && !isDailyChallengeSelected ? "selected" : ""} btn--sm`}
        onClick={() => handleDifficulty("medium")}
      >
        {t("difficulties.medium")}
      </button>
      <button
        className={`btn ${gameDifficulty === "hard" && !isDailyChallengeSelected ? "selected" : ""} btn--sm btn--lose`}
        onClick={() => handleDifficulty("hard")}
      >
        {t("difficulties.hard")}
      </button>
      {showDailyChallenge && onDailyChallengeClick && (
        <button
          className={`btn btn--sm btn--daily ${isDailyChallengeSelected ? "selected" : ""}`}
          onClick={onDailyChallengeClick}
          disabled={loadingDaily}
        >
          {t("dailyChallenge.button")}
        </button>
      )}
      <Tooltip message={t("difficulties.tooltip")}>
        <div className="info-icon">i</div>
      </Tooltip>
    </div>
  );
}
