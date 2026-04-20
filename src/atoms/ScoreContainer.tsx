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
    const el = containerRef.current;
    if (!el) return;

    const gapPx = 4;
    const getLogo = () =>
      el.closest("main")?.querySelector<HTMLElement>(".logo-container");

    const updateTop = () => {
      const logo = getLogo();
      const marginBottom = logo
        ? parseFloat(getComputedStyle(logo).marginBottom) || 0
        : 0;
      const logoBlock = (logo?.offsetHeight ?? 0) + marginBottom;
      if (logoBlock > 0) {
        el.style.top = `${-logoBlock - gapPx}px`;
      } else {
        el.style.top = `${-el.offsetHeight - gapPx}px`;
      }
    };

    updateTop();
    const raf = requestAnimationFrame(updateTop);

    const logo = getLogo();
    const ro = new ResizeObserver(updateTop);
    ro.observe(el);
    if (logo) ro.observe(logo);

    window.addEventListener("resize", updateTop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", updateTop);
    };
  }, []);

  return (
    <div className="score__container score__container--abs" ref={containerRef}>
      <div
        className={`score__container--box ${guessedCount === words.length ? "won" : ""}`}
      >
        <div className="score__info">
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
        <div className="score__info">
          <div className="v-section">
            {gameDifficulty === "daily" ? (
              <div className="v-section">
                <p>{t("game.dailyTargetScore").toUpperCase()}</p>
                <h3>{correctWordsPoints()}</h3>
              </div>
            ) : (
              <div className="score__info">
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
