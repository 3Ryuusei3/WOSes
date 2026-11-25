import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import Word from "../types/Word";
import Difficulty from "../types/Difficulty";
import DifficultyTag from "./DifficultyTag";
import BackHomeButton from "./BackHomeButton";
import RoundTimer from "./RoundTimer";

interface GameHudProps {
  words: Word[];
  correctWordsPoints: () => number;
  goalPoints: number;
  level: number;
  gameDifficulty: Difficulty;
  dailyChallengeOriginalDifficulty: Difficulty | null;
  timeLeft: number;
  percentage: number;
  startedAt: number;
  durationMs: number;
  RUNNING_OUT_OF_TIME_PERCENTAGE: number;
  SHOW_LETTERS_PERCENTAGE: number;
  /** Right end of the bar (the sound button on desktop) */
  trailing?: ReactNode;
}

/**
 * Bar above the board: back + level | round clock | points + words.
 * Takes the logo's place while playing.
 */
export default function GameHud({
  words,
  correctWordsPoints,
  goalPoints,
  level,
  gameDifficulty,
  dailyChallengeOriginalDifficulty,
  timeLeft,
  percentage,
  startedAt,
  durationMs,
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHOW_LETTERS_PERCENTAGE,
  trailing,
}: GameHudProps) {
  const { t } = useTranslation();
  const guessedCount = words.filter((w) => w.guessed).length;
  const points = correctWordsPoints();
  const isDaily = gameDifficulty === "daily";
  const goalReached = !isDaily && points >= goalPoints;
  const allFound = words.length > 0 && guessedCount === words.length;

  return (
    <div className="game-hud">
      <div className="game-hud__side game-hud__side--start">
        <BackHomeButton className="back-control--hud" />
        <div className="game-hud__card game-hud__card--level">
          {!isDaily && (
            <div className="game-hud__stat">
              <span className="game-hud__label">
                {t("common.level").toUpperCase()}
              </span>
              <span className="game-hud__value">{level}</span>
            </div>
          )}
          <DifficultyTag
            gameDifficulty={gameDifficulty}
            dailyChallengeOriginalDifficulty={dailyChallengeOriginalDifficulty}
          />
        </div>
      </div>

      <RoundTimer
        timeLeft={timeLeft}
        percentage={percentage}
        startedAt={startedAt}
        durationMs={durationMs}
        RUNNING_OUT_OF_TIME_PERCENTAGE={RUNNING_OUT_OF_TIME_PERCENTAGE}
        SHOW_LETTERS_PERCENTAGE={SHOW_LETTERS_PERCENTAGE}
      />

      <div className="game-hud__side game-hud__side--end">
        <div
          className={`game-hud__card game-hud__card--score ${goalReached ? "is-goal" : ""} ${allFound ? "is-perfect" : ""}`}
        >
          <div className="game-hud__stat">
            <span className="game-hud__label">
              {isDaily
                ? t("game.dailyTargetScore").toUpperCase()
                : t("game.targetScore").toUpperCase()}
            </span>
            <span className="game-hud__value">
              {points}
              {!isDaily && <small>/{goalPoints}</small>}
            </span>
          </div>
          {!isDaily && (
            <div className="game-hud__stat">
              <span className="game-hud__label">
                {t("game.foundWords").toUpperCase()}
              </span>
              <span className="game-hud__value game-hud__value--words">
                {guessedCount}
                <small>/{words.length}</small>
              </span>
            </div>
          )}
        </div>
        {trailing}
      </div>
    </div>
  );
}
