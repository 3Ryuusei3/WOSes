import { useState, useEffect, useRef } from "react";
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

  // Function to map database response to TopScore type
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
      id: String(item.id), // Convert to string for TopScore interface
      name: item.name,
      score: item.score,
      level: item.level,
      created_at: item.created_at,
    }));

  // Function to fetch scores from Supabase
  const fetchScores = async () => {
    try {
      if (isDaily && challengeNumber) {
        // Fetch daily challenge ranking
        const { data: dailyData, error: dailyError } =
          await getDailyChallengeRanking(challengeNumber);
        if (dailyError) throw dailyError;
        if (dailyData) setDailyScores(dailyData);
      } else {
        // Normal ranking logic
        const weekRange = getThisWeekDateRange();
        const currentLanguage = i18n.language;

        // Get all-time scores
        const { data: allTimeData, error: allTimeError } =
          await getAllTimeTopScores(difficulty, currentLanguage);
        if (allTimeError) throw allTimeError;

        // Get weekly scores
        const { data: weeklyData, error: weeklyError } =
          await getWeeklyTopScores(
            difficulty,
            currentLanguage,
            weekRange.start,
            weekRange.end,
          );
        if (weeklyError) throw weeklyError;

        // Update state with fetched data
        if (allTimeData) setAllTimeScores(mapScores(allTimeData));
        if (weeklyData) setWeeklyScores(mapScores(weeklyData));
      }
    } catch (error) {
      console.error("Error fetching scores:", error);
    }
  };

  useEffect(() => {
    // Initial fetch of scores
    fetchScores();

    // Set up realtime subscription
    if (isDaily && challengeNumber) {
      channelRef.current = subscribeToDailyChallengeRanking(
        fetchScores,
        challengeNumber,
      );
    } else {
      channelRef.current = subscribeToScores(
        () => {
          // Refresh scores when a change is detected
          fetchScores();
        },
        difficulty,
        i18n.language,
      );
    }

    // Cleanup function to unsubscribe from realtime updates
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

  return (
    <div className={`v-section ${hasTooltip ? "gap-xs" : "gap-md"}`}>
      {!isDaily && (
        <div
          className={`top-scores__arrows ${hasTooltip ? "top-scores__arrows--tooltip" : ""}`}
        >
          <img src={arrowLeft} alt="arrow-left" onClick={toggleRanking} />
          <img src={arrowRight} alt="arrow-right" onClick={toggleRanking} />
        </div>
      )}
      <div className="v-section gap-2xs">
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
              <p>{t(`difficulties.${difficulty}`)}</p>
            )}
          </>
        )}
      </div>
      <div className="ranking">
        {hasTooltip && !isDaily && (
          <Tooltip message={t("topScores.updateDelay")}>
            <div className="info-icon">i</div>
          </Tooltip>
        )}
        <div>
          <table className="ranking__table">
            <tbody>
              {Array.from({ length: 10 }, (_, index) => {
                if (isDaily) {
                  const entry = dailyScores[index];
                  return (
                    <tr key={index}>
                      <td>
                        <span
                          className={`${
                            index === 0
                              ? "won"
                              : index === 1
                                ? "highlight"
                                : index === 2
                                  ? "unguessed"
                                  : "lost"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        {entry?.name || "................."}
                        {entry && !entry.is_first_attempt && (
                          <span className="daily-retry-badge"> ↻</span>
                        )}
                      </td>
                      <td>{entry?.score || "......."}</td>
                      <td>
                        {entry?.time_elapsed
                          ? `${entry.time_elapsed}s`
                          : "......."}
                      </td>
                    </tr>
                  );
                } else {
                  const entry = currentScores[index] || {
                    name: "",
                    score: 0,
                    level: 0,
                  };
                  return (
                    <tr key={index}>
                      <td>
                        <span
                          className={`${
                            index === 0
                              ? "won"
                              : index === 1
                                ? "highlight"
                                : index === 2
                                  ? "unguessed"
                                  : "lost"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td>{entry.name || "................."}</td>
                      <td>{entry.score || "......."}</td>
                      <td>
                        {entry.level
                          ? `LV${String(entry.level).padStart(2, "0")}`
                          : "......."}
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
