/**
 * Rankings cache: every ranking already seen shows at once (from memory, or
 * from localStorage after a reload) while a fresh copy is fetched behind it
 * ("stale while revalidate"). The same request is never sent twice at the
 * same time, and the start screen warms all difficulties up in advance.
 */
import TopScore from "../types/TopScore";
import { DailyChallengeRankingEntry } from "../types/DailyChallenge";
import { getAllTimeTopScores, getWeeklyTopScores } from "./rooms";
import { getDailyChallengeRanking } from "./dailyChallenge";
import { getThisWeekDateRange } from "../utils";

export interface DifficultyRanking {
  allTime: TopScore[];
  weekly: TopScore[];
}

const STORAGE_PREFIX = "lexio-ranking:";
const memory = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();

function read<T>(key: string): T | undefined {
  if (memory.has(key)) return memory.get(key) as T;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return undefined;
    const value = JSON.parse(raw) as T;
    memory.set(key, value);
    return value;
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  memory.set(key, value);
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable: memory is enough */
  }
}

function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const p = load().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

const mapScores = (
  data: {
    id: number;
    code?: string;
    name: string;
    score: number;
    level: number;
    created_at: string;
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

// The weekly list belongs to its week: a new week starts empty
const difficultyKey = (difficulty: string, language: string) =>
  `${difficulty}:${language}:${getThisWeekDateRange().start}`;

export function cachedDifficultyRanking(
  difficulty: string,
  language: string,
): DifficultyRanking | undefined {
  return read<DifficultyRanking>(difficultyKey(difficulty, language));
}

/** All-time + weekly top 10 of a difficulty (both asked at the same time) */
export function fetchDifficultyRanking(
  difficulty: string,
  language: string,
): Promise<DifficultyRanking> {
  const key = difficultyKey(difficulty, language);
  return once(key, async () => {
    const week = getThisWeekDateRange();
    const [allTime, weekly] = await Promise.all([
      getAllTimeTopScores(difficulty, language),
      getWeeklyTopScores(difficulty, language, week.start, week.end),
    ]);
    if (allTime.error) throw allTime.error;
    if (weekly.error) throw weekly.error;
    const value: DifficultyRanking = {
      allTime: mapScores(allTime.data ?? []),
      weekly: mapScores(weekly.data ?? []),
    };
    write(key, value);
    return value;
  });
}

export function cachedDailyRanking(
  challengeNumber: number,
): DailyChallengeRankingEntry[] | undefined {
  return read<DailyChallengeRankingEntry[]>(`daily:${challengeNumber}`);
}

export function fetchDailyRanking(
  challengeNumber: number,
): Promise<DailyChallengeRankingEntry[]> {
  const key = `daily:${challengeNumber}`;
  return once(key, async () => {
    const { data, error } = await getDailyChallengeRanking(challengeNumber);
    if (error) throw error;
    const value = data ?? [];
    write(key, value);
    return value;
  });
}

/** Start screen: load the rankings of every difficulty in the background,
 *  so switching between them is instant */
export function prefetchRankings(language: string) {
  for (const difficulty of ["easy", "medium", "hard"]) {
    fetchDifficultyRanking(difficulty, language).catch(() => {});
  }
}
