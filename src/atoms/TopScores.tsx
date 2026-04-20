import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";

import Tooltip from "./Tooltip";

import useGameStore from "../store/useGameStore";

import TopScore from "../types/TopScore";
import Difficulty from "../types/Difficulty";
import { DailyChallengeRankingEntry } from "../types/DailyChallenge";

import {
  getAllTimeTopScores,
  getWeeklyTopScores,
  subscribeToScores,
} from "../services/rooms";
import {
  getDailyChallengeRanking,
  subscribeToDailyChallengeRanking,
} from "../services/dailyChallenge";
import { RealtimeChannel } from "@supabase/supabase-js";

import { getThisWeekDateRange } from "../utils";

import arrowLeft from "../assets/arrow-left.svg";
import arrowRight from "../assets/arrow-right.svg";

const dots = (n: number) => ".".repeat(Math.max(0, n));

interface TopScoresProps {
  hasTooltip?: boolean;
  difficulty?: Difficulty;
  challengeNumber?: number;
}

export default function TopScores({
  hasTooltip = false,
  difficulty = "hard",
  challengeNumber,
}: TopScoresProps) {
  const { t, i18n } = useTranslation();
  const { highestScore } = useGameStore();
  const [allTimeScores, setAllTimeScores] = useState<TopScore[]>([]);
  const [weeklyScores, setWeeklyScores] = useState<TopScore[]>([]);
  const [dailyScores, setDailyScores] = useState<DailyChallengeRankingEntry[]>(
    [],
  );
  const [showAllTime, setShowAllTime] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const isDaily = difficulty === "daily";
  const today = new Date().toLocaleDateString();

  const mapScores = (
    data: {
      id: number;
      name: string;
      score: number;
      level: number;
      created_at: string;
      updated_at?: string;
    }[],
  ): TopScore[] =>
    data.map((item) => ({
      id: String(item.id),
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
      }
    } catch (error) {
      console.error("Error fetching scores:", error);
    }
  };

  useEffect(() => {
    fetchScores();

    if (isDaily && challengeNumber) {
      channelRef.current = subscribeToDailyChallengeRanking(
        fetchScores,
        challengeNumber,
      );
    } else {
      channelRef.current = subscribeToScores(
        () => {
          fetchScores();
        },
        difficulty,
        i18n.language,
      );
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [highestScore, difficulty, i18n.language, isDaily, challengeNumber]);

  const toggleRanking = () => {
    setShowAllTime((prev) => !prev);
  };

  const currentScores = showAllTime ? allTimeScores : weeklyScores;

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

  const rankToneClass = (index: number) =>
    index === 0
      ? "won"
      : index === 1
        ? "highlight"
        : index === 2
          ? "unguessed"
          : "lost";

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
        <div className="v-section">
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
                <div key={index} className="ranking__row">
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
            const entry = currentScores[index] || {
              name: "",
              score: 0,
              level: 0,
            };
            return (
              <div key={index} className="ranking__row">
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
        </div>
      </div>
    </div>
  );
}
