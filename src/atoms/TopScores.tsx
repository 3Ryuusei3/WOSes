import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import Tooltip from "./Tooltip";

import useGameStore from "../store/useGameStore";

import TopScore from "../types/TopScore";
import Difficulty from "../types/Difficulty";
import { DailyChallengeRankingEntry } from "../types/DailyChallenge";

import {
  getAllTimeTopScores,
  getRoomRank,
  getWeeklyTopScores,
  type RoomRank,
} from "../services/rooms";
import { getDailyChallengeRanking } from "../services/dailyChallenge";
import { onScoreAdded } from "../realtime/scoresRealtime";

import { getThisWeekDateRange } from "../utils";

import arrowLeft from "../assets/arrow-left.svg";
import arrowRight from "../assets/arrow-right.svg";

const dots = (n: number) => ".".repeat(Math.max(0, n));

interface TopScoresProps {
  hasTooltip?: boolean;
  difficulty?: Difficulty;
  challengeNumber?: number;
  /** Multiplayer game to highlight (its room code); also shows its position
   *  under the list when it is not in the top 10 */
  highlightCode?: string;
}

export default function TopScores({
  hasTooltip = false,
  difficulty = "hard",
  challengeNumber,
  highlightCode,
}: TopScoresProps) {
  const { t, i18n } = useTranslation();
  const { highestScore } = useGameStore();
  const [allTimeScores, setAllTimeScores] = useState<TopScore[]>([]);
  const [weeklyScores, setWeeklyScores] = useState<TopScore[]>([]);
  const [dailyScores, setDailyScores] = useState<DailyChallengeRankingEntry[]>(
    [],
  );
  const [showAllTime, setShowAllTime] = useState(true);
  const [roomRank, setRoomRank] = useState<RoomRank | null>(null);

  const isDaily = difficulty === "daily";
  const today = new Date().toLocaleDateString();

  const mapScores = (
    data: {
      id: number;
      code?: string;
      name: string;
      score: number;
      level: number;
      created_at: string;
      updated_at?: string;
    }[],
  ): TopScore[] =>
    data.map((item) => ({
      id: String(item.id),
      code: item.code,
      name: item.name,
      score: item.score,
      level: item.level,
      created_at: item.created_at,
    }));

  const fetchScores = async () => {
    try {
      if (isDaily && challengeNumber) {
        const { data: dailyData, error: dailyError } =
          await getDailyChallengeRanking(challengeNumber);
        if (dailyError) throw dailyError;
        if (dailyData) setDailyScores(dailyData);
      } else {
        const weekRange = getThisWeekDateRange();
        const currentLanguage = i18n.language;

        const { data: allTimeData, error: allTimeError } =
          await getAllTimeTopScores(difficulty, currentLanguage);
        if (allTimeError) throw allTimeError;

        const { data: weeklyData, error: weeklyError } =
          await getWeeklyTopScores(
            difficulty,
            currentLanguage,
            weekRange.start,
            weekRange.end,
          );
        if (weeklyError) throw weeklyError;

        if (allTimeData) setAllTimeScores(mapScores(allTimeData));
        if (weeklyData) setWeeklyScores(mapScores(weeklyData));

        if (highlightCode) {
          const { data: rankData } = await getRoomRank(
            highlightCode,
            difficulty,
            currentLanguage,
          );
          setRoomRank(rankData);
        }
      }
    } catch (error) {
      console.error("Error fetching scores:", error);
    }
  };

  useEffect(() => {
    fetchScores();

    // Solo recargamos si la nueva puntuación afecta a este ranking
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = onScoreAdded((p) => {
      const relevant =
        isDaily && challengeNumber
          ? p.challenge_number === challengeNumber
          : p.difficulty === difficulty && p.language === i18n.language;
      if (!relevant) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(fetchScores, 500);
    });

    return () => {
      if (debounce) clearTimeout(debounce);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    highestScore,
    difficulty,
    i18n.language,
    isDaily,
    challengeNumber,
    highlightCode,
  ]);

  // The host saves the final score a moment after everyone reaches the end
  // screen: retry a couple of times until this game shows up
  useEffect(() => {
    if (!highlightCode || isDaily || roomRank) return;
    const ids = [3000, 8000].map((ms) => setTimeout(fetchScores, ms));
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightCode, isDaily, roomRank === null]);

  const toggleRanking = () => {
    setShowAllTime((prev) => !prev);
  };

  const currentScores = showAllTime ? allTimeScores : weeklyScores;
  // This game outside the visible top 10: its position goes under the list
  // (the rank is computed against the all-time ranking)
  const showOwnRank =
    !isDaily &&
    showAllTime &&
    !!highlightCode &&
    !currentScores.some((e) => e.code === highlightCode);

  const columnFormat = useMemo(() => {
    if (isDaily) {
      let maxScore = 1;
      let maxTime = 1;
      let nameLen = 14;
      for (const e of dailyScores) {
        maxScore = Math.max(maxScore, String(e.score ?? 0).length);
        if (e.time_elapsed != null) {
          maxTime = Math.max(maxTime, String(e.time_elapsed).length);
        }
        if (e.name) nameLen = Math.max(nameLen, e.name.length);
      }
      return {
        scoreLen: Math.max(4, maxScore),
        timeLen: Math.max(2, maxTime),
        levelLen: 3,
        nameDotsLen: Math.max(14, nameLen),
      };
    }
    let maxScore = 1;
    let maxLevel = 1;
    let nameLen = 14;
    for (const e of currentScores) {
      maxScore = Math.max(maxScore, String(e?.score ?? 0).length);
      if (e?.level) {
        maxLevel = Math.max(maxLevel, String(e.level).length);
      }
      if (e?.name) nameLen = Math.max(nameLen, e.name.length);
    }
    return {
      scoreLen: Math.max(4, maxScore),
      levelLen: Math.max(2, maxLevel),
      timeLen: 2,
      nameDotsLen: Math.max(14, nameLen),
    };
  }, [isDaily, dailyScores, currentScores]);

  // Podium colours: gold, silver (blue), bronze; the rest muted
  const rankToneClass = (index: number) =>
    index === 0
      ? "rank-gold"
      : index === 1
        ? "rank-silver"
        : index === 2
          ? "rank-bronze"
          : "rank-other";

  return (
    <div className={`v-section ${hasTooltip ? "gap-xs" : "gap-md"}`}>
      <div className="h-section f-jc-sb f-ai-c">
        {!isDaily && (
          <img
            src={arrowLeft}
            alt="arrow-left"
            width={46}
            height={46}
            onClick={toggleRanking}
          />
        )}
        {/* Title and difficulty centered between the arrows */}
        <div className="v-section f-ai-c txt-center">
          {hasTooltip ? (
            <>
              <h4 className="highlight">
                {isDaily && challengeNumber
                  ? t("dailyChallenge.ranking") +
                    " - " +
                    t("dailyChallenge.challengeNumber", {
                      number: challengeNumber,
                    })
                  : showAllTime
                    ? t("topScores.allTime")
                    : t("topScores.thisWeek")}
              </h4>
              {!isDaily && <p>{t(`difficulties.${difficulty}`)}</p>}
            </>
          ) : (
            <>
              <h2>
                {isDaily
                  ? t("dailyChallenge.ranking")
                  : showAllTime
                    ? t("topScores.allTime")
                    : t("topScores.thisWeek")}
              </h2>
              {isDaily ? (
                <p>
                  {t("dailyChallenge.challengeNumber", {
                    number: challengeNumber,
                  })}{" "}
                  - {today}
                </p>
              ) : (
                <p className="txt-center">{t(`difficulties.${difficulty}`)}</p>
              )}
            </>
          )}
        </div>
        {!isDaily && (
          <img
            src={arrowRight}
            alt="arrow-right"
            width={46}
            height={46}
            onClick={toggleRanking}
          />
        )}
      </div>

      <div className="ranking">
        {hasTooltip && !isDaily && (
          <Tooltip message={t("topScores.updateDelay")}>
            <div className="info-icon">i</div>
          </Tooltip>
        )}
        <div className="ranking__grid">
          <div className="ranking__row ranking__row--head">
            <span className="ranking__cell ranking__cell--rank"></span>
            <span className="ranking__cell ranking__cell--name">
              {t("topScores.player")}
            </span>
            <span className="ranking__cell ranking__cell--num">
              {t("topScores.columnScore")}
            </span>
            <span className="ranking__cell ranking__cell--num">
              {isDaily ? t("topScores.columnTime") : t("topScores.columnLevel")}
            </span>
          </div>
          {Array.from({ length: 10 }, (_, index) => {
            if (isDaily) {
              const entry = dailyScores[index];
              return (
                <div
                  key={index}
                  className={`ranking__row ${!entry?.name ? "ranking__row--empty" : index === 0 ? "ranking__row--first" : ""}`}
                >
                  <span className="ranking__cell ranking__cell--rank">
                    <span className={rankToneClass(index)}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="ranking__cell ranking__cell--name">
                    {entry?.name ? entry.name : dots(columnFormat.nameDotsLen)}
                    {entry && !entry.is_first_attempt && (
                      <span className="daily-retry-badge"> ↻</span>
                    )}
                  </span>
                  <span className="ranking__cell ranking__cell--num">
                    {entry
                      ? String(entry.score).padStart(columnFormat.scoreLen, "0")
                      : dots(columnFormat.scoreLen)}
                  </span>
                  <span className="ranking__cell ranking__cell--num">
                    {entry && entry.time_elapsed != null
                      ? `${String(entry.time_elapsed).padStart(columnFormat.timeLen, "0")}s`
                      : `${dots(columnFormat.timeLen)}s`}
                  </span>
                </div>
              );
            }
            const entry: Partial<TopScore> & {
              name: string;
              score: number;
              level: number;
            } = currentScores[index] || {
              name: "",
              score: 0,
              level: 0,
            };
            const isMine = !!highlightCode && entry.code === highlightCode;
            return (
              <div
                key={index}
                className={`ranking__row ${isMine ? "ranking__row--mine" : !entry.name ? "ranking__row--empty" : index === 0 ? "ranking__row--first" : ""}`}
              >
                <span className="ranking__cell ranking__cell--rank">
                  <span className={rankToneClass(index)}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="ranking__cell ranking__cell--name">
                  {entry.name ? entry.name : dots(columnFormat.nameDotsLen)}
                </span>
                <span className="ranking__cell ranking__cell--num">
                  {entry.name
                    ? String(entry.score).padStart(columnFormat.scoreLen, "0")
                    : dots(columnFormat.scoreLen)}
                </span>
                <span className="ranking__cell ranking__cell--num">
                  {entry.name && entry.level > 0
                    ? `${String(entry.level).padStart(columnFormat.levelLen, "0")}`
                    : dots(2 + columnFormat.levelLen)}
                </span>
              </div>
            );
          })}
          {showOwnRank && roomRank && (
            <>
              <div className="ranking__row ranking__row--gap">
                <span className="ranking__cell ranking__cell--rank">···</span>
              </div>
              <div className="ranking__row ranking__row--mine">
                <span className="ranking__cell ranking__cell--rank">
                  {String(roomRank.rank).padStart(2, "0")}
                </span>
                <span className="ranking__cell ranking__cell--name">
                  {roomRank.name || t("topScores.yourGame")}
                </span>
                <span className="ranking__cell ranking__cell--num">
                  {String(roomRank.score).padStart(columnFormat.scoreLen, "0")}
                </span>
                <span className="ranking__cell ranking__cell--num">
                  {String(roomRank.level).padStart(columnFormat.levelLen, "0")}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
