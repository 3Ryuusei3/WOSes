import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

import Word from "../types/Word";
import Difficulty from "../types/Difficulty";
import DifficultyTag from "./DifficultyTag";

interface ScoreContainerProps {
  words: Word[];
  correctWordsPoints: () => number;
  goalPoints: number;
  level: number;
  gameDifficulty: Difficulty;
  dailyChallengeOriginalDifficulty: Difficulty | null;
}

export default function ScoreContainer({
  words,
  correctWordsPoints,
  goalPoints,
  level,
  gameDifficulty,
  dailyChallengeOriginalDifficulty,
}: ScoreContainerProps) {
  const { t } = useTranslation();
  const guessedCount = words.filter((w) => w.guessed).length;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.top = `${containerRef.current.offsetHeight * -1 - 15}px`;
    }
  }, []);

  return (
    <div className="score__container score__container--abs" ref={containerRef}>
      <div
        className={`score__container--box ${guessedCount === words.length ? "won" : ""}`}
      >
        <div className="h-section gap-md">
          {gameDifficulty !== "daily" && (
            <div className="v-section">
              <p>{t("common.level").toUpperCase()}</p>
              <h3>{level}</h3>
            </div>
          )}
          <div className="v-section gap-2xs">
            <p>{t("common.difficulty").toUpperCase()}</p>
            <DifficultyTag
              gameDifficulty={gameDifficulty}
              dailyChallengeOriginalDifficulty={
                dailyChallengeOriginalDifficulty
              }
            />
          </div>
        </div>
      </div>
      <div
        className={`score__container--box ${correctWordsPoints() >= goalPoints ? "won" : ""}`}
      >
        <div className="h-section gap-md">
          <div className="v-section">
            {gameDifficulty === "daily" ? (
              <div className="v-section">
                <p>{t("game.dailyTargetScore").toUpperCase()}</p>
                <h3>{correctWordsPoints()}</h3>
              </div>
            ) : (
              <div className="h-section gap-md">
                <div className="v-section">
                  <p>{t("game.targetScore").toUpperCase()}</p>
                  <h3>
                    {correctWordsPoints()}/{goalPoints}
                  </h3>
                </div>
                <div className="v-section">
                  <p>{t("game.foundWords").toUpperCase()}</p>
                  <h3>
                    {guessedCount}/{words.length}
                  </h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
