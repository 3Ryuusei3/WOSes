import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import Tooltip from "./Tooltip";

import useGameStore from "../store/useGameStore";

import TopScore from "../types/TopScore";
import Difficulty from "../types/Difficulty";
import { DailyChallengeRankingEntry } from "../types/DailyChallenge";

import { getRoomRank, type RoomRank } from "../services/rooms";
import {
  cachedDailyRanking,
  cachedDifficultyRanking,
  fetchDailyRanking,
  fetchDifficultyRanking,
} from "../services/rankingCache";
import { onScoreAdded } from "../realtime/scoresRealtime";

import arrowLeft from "../assets/arrow-left.svg";
import arrowRight from "../assets/arrow-right.svg";

const dots = (n: number) => ".".repeat(Math.max(0, n));
const isDailyDifficulty = (d: Difficulty) => d === "daily";

interface TopScoresProps {
  hasTooltip?: boolean;
  difficulty?: Difficulty;
  challengeNumber?: number;
  /** Multiplayer game to highlight (its room code); also shows its position
   *  under the list when it is not in the top 10 */
  highlightCode?: string;
  /** Single player's game just finished: highlighted when it's in the list,
   *  and its place (or null) reported for each ranking */
  ownGame?: { name: string; score: number; level: number };
  onOwnPlacement?: (placement: {
    allTime: number | null;
    weekly: number | null;
    weeklyLast: TopScore | null;
  }) => void;
  /** Data not there yet (daily challenge loading): "loading" in the box */
  loading?: boolean;
}

export default function TopScores({
  hasTooltip = false,
  difficulty = "hard",
  challengeNumber,
  highlightCode,
  ownGame,
  onOwnPlacement,
  loading = false,
}: TopScoresProps) {
  const { t, i18n } = useTranslation();
  const { highestScore } = useGameStore();
  // What's already known for this ranking shows at once (cache), then the
  // fresh copy replaces it
  // (Not for a game that just ended: its own result must come in first)
  const useCache = !ownGame && !highlightCode;
  const cached =
    useCache && !isDailyDifficulty(difficulty)
      ? cachedDifficultyRanking(difficulty, i18n.language)
      : undefined;
  const [allTimeScores, setAllTimeScores] = useState<TopScore[]>(
    cached?.allTime ?? [],
  );
  const [weeklyScores, setWeeklyScores] = useState<TopScore[]>(
    cached?.weekly ?? [],
  );
  const [dailyScores, setDailyScores] = useState<DailyChallengeRankingEntry[]>(
    () =>
      useCache && isDailyDifficulty(difficulty) && challengeNumber
        ? (cachedDailyRanking(challengeNumber) ?? [])
        : [],
  );
  const [showAllTime, setShowAllTime] = useState(true);
  const [roomRank, setRoomRank] = useState<RoomRank | null>(null);

  const isDaily = difficulty === "daily";
  const today = new Date().toLocaleDateString();

  const fetchScores = async () => {
    try {
      if (isDaily) {
        // Challenge not loaded yet: nothing to ask for
        if (!challengeNumber) return;
        setDailyScores(await fetchDailyRanking(challengeNumber));
      } else {
        const currentLanguage = i18n.language;
        const ranking = await fetchDifficultyRanking(
          difficulty,
          currentLanguage,
        );
        setAllTimeScores(ranking.allTime);
        setWeeklyScores(ranking.weekly);

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

  // Another ranking chosen: show its cached copy right away (or empty)
  useEffect(() => {
    if (!useCache) return;
    if (isDaily) {
      setDailyScores(
        challengeNumber ? (cachedDailyRanking(challengeNumber) ?? []) : [],
      );
    } else {
      const known = cachedDifficultyRanking(difficulty, i18n.language);
      setAllTimeScores(known?.allTime ?? []);
      setWeeklyScores(known?.weekly ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, i18n.language, isDaily, challengeNumber]);

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

  // Where the player's own (single player) game landed in each list
  const isOwn = (e: Partial<TopScore> | undefined) =>
    !!ownGame &&
    !!e &&
    e.name === ownGame.name &&
    e.score === ownGame.score &&
    e.level === ownGame.level;
  const ownAllTime = ownGame ? allTimeScores.findIndex(isOwn) : -1;
  const ownWeekly = ownGame ? weeklyScores.findIndex(isOwn) : -1;
  const loaded = allTimeScores.length > 0 || weeklyScores.length > 0;
  useEffect(() => {
    if (!ownGame || !onOwnPlacement || !loaded) return;
    onOwnPlacement({
      allTime: ownAllTime >= 0 ? ownAllTime + 1 : null,
      weekly: ownWeekly >= 0 ? ownWeekly + 1 : null,
      weeklyLast: weeklyScores.length >= 10 ? weeklyScores[9] : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownAllTime, ownWeekly, loaded, weeklyScores.length]);

  // Our own game is saved a moment after the end screen shows up: look again
  // a couple of times until it's in
  useEffect(() => {
    if (!ownGame || isDaily) return;
    const ids = [2500, 6000].map((ms) => setTimeout(fetchScores, ms));
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!ownGame, isDaily]);

  const toggleRanking = () => {
    setShowAllTime((prev) => !prev);
  };

  const currentScores = showAllTime ? allTimeScores : weeklyScores;
  const shownCount = Math.min(
    10,
    (isDaily ? dailyScores : currentScores).filter((e) => !!e?.name).length,
  );
  // This game outside the visible top 10: its position goes under the list
  // (the rank is computed against the all-time ranking)
  const showOwnRank =
    !isDaily &&
    showAllTime &&
    !!highlightCode &&
    !currentScores.some((e) => e.code === highlightCode);
  const isEmpty = shownCount === 0 && !(showOwnRank && roomRank);

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
        {/* The daily challenge has one ranking (no arrows): same-size gaps
            instead, so the box looks and measures the same */}
        {!isDaily ? (
          <img
            src={arrowLeft}
            alt="arrow-left"
            width={46}
            height={46}
            onClick={toggleRanking}
          />
        ) : (
          <span className="top-scores__arrow-gap" aria-hidden="true" />
        )}
        {/* Title and difficulty centered between the arrows */}
        <div className="v-section f-ai-c txt-center">
          {hasTooltip ? (
            <>
              <h4 className="highlight top-scores__title">
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
              {!isDaily && (
                <p className="top-scores__sub">
                  {t(`difficulties.${difficulty}`)}
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="top-scores__title">
                {isDaily
                  ? t("dailyChallenge.ranking")
                  : showAllTime
                    ? t("topScores.allTime")
                    : t("topScores.thisWeek")}
              </h2>
              {isDaily ? (
                <p className="txt-center top-scores__sub">
                  {challengeNumber
                    ? `${t("dailyChallenge.challengeNumber", { number: challengeNumber })} · `
                    : ""}
                  {today}
                </p>
              ) : (
                <p className="txt-center top-scores__sub">
                  {t(`difficulties.${difficulty}`)}
                </p>
              )}
            </>
          )}
        </div>
        {!isDaily ? (
          <img
            src={arrowRight}
            alt="arrow-right"
            width={46}
            height={46}
            onClick={toggleRanking}
          />
        ) : (
          <span className="top-scores__arrow-gap" aria-hidden="true" />
        )}
      </div>

      <div className="ranking">
        {hasTooltip && !isDaily && (
          <Tooltip message={t("topScores.updateDelay")}>
            <div className="info-icon">i</div>
          </Tooltip>
        )}
        {/* Nobody yet: a message instead of empty rows */}
        {isEmpty && (
          <p className="ranking__empty">
            {loading ? t("common.loading") : t("topScores.empty")}
          </p>
        )}
        <div className={`ranking__grid ${isEmpty ? "is-empty" : ""}`}>
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
          {/* Only the places that are taken; the rest are invisible
              placeholders (phones keep the space of 10 rows, see index.scss) */}
          {Array.from({ length: 10 - shownCount }, (_, i) => (
            <div
              key={`placeholder-${i}`}
              className="ranking__row ranking__row--placeholder"
              aria-hidden="true"
              style={{ order: 100 }}
            >
              <span className="ranking__cell ranking__cell--rank">00</span>
              <span className="ranking__cell ranking__cell--name">·</span>
              <span className="ranking__cell ranking__cell--num">0</span>
              <span className="ranking__cell ranking__cell--num">0</span>
            </div>
          ))}
          {Array.from({ length: shownCount }, (_, index) => {
            if (isDaily) {
              const entry = dailyScores[index];
              return (
                <div
                  key={index}
                  className={`ranking__row ${!entry?.name ? "ranking__row--empty" : index < 3 ? `ranking__row--p${index + 1}` : ""}`}
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
            const isMine =
              (!!highlightCode && entry.code === highlightCode) ||
              isOwn(entry);
            return (
              <div
                key={index}
                className={`ranking__row ${isMine ? "ranking__row--mine" : !entry.name ? "ranking__row--empty" : index < 3 ? `ranking__row--p${index + 1}` : ""}`}
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
