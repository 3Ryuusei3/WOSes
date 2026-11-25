import { supabase } from "../lib/supabase";
import { PostgrestError } from "@supabase/supabase-js";

interface ScoreRecord {
  id: number;
  /** Room code: identifies a multiplayer game in the rankings */
  code?: string;
  name: string;
  score: number;
  level: number;
  difficulty: string;
  language: string;
  created_at: string;
  updated_at?: string;
  rounds?: number;
  perfects?: number;
}

type DbResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

// Get all-time top scores for a specific difficulty and language
export async function getAllTimeTopScores(
  difficulty: string,
  language: string,
  limit = 10,
): Promise<DbResponse<ScoreRecord[]>> {
  return await supabase
    .from("rooms")
    .select("*")
    .eq("difficulty", difficulty)
    .eq("language", language)
    .eq("state", "lost")
    .neq("difficulty", "daily")
    .not("level", "is", null)
    .not("score", "is", null)
    .order("level", { ascending: false })
    .order("score", { ascending: true })
    .order("rounds", { ascending: true })
    .order("perfects", { ascending: false })
    .limit(limit);
}

export interface RoomRank {
  /** 1-based position in the all-time ranking of its difficulty */
  rank: number;
  name: string;
  score: number;
  level: number;
}

/**
 * Position of one finished game (room) in the all-time ranking, with the same
 * order as getAllTimeTopScores: level desc, then score asc, then rounds asc.
 * null while the room has no final score yet.
 */
export async function getRoomRank(
  code: string,
  difficulty: string,
  language: string,
): Promise<DbResponse<RoomRank>> {
  const { data: room, error } = await supabase
    .from("rooms")
    .select("name, score, level, rounds")
    .eq("code", code)
    .eq("state", "lost")
    .not("level", "is", null)
    .not("score", "is", null)
    .maybeSingle();
  if (error || !room) return { data: null, error };

  const { level, score } = room as { level: number; score: number };
  const rounds = (room as { rounds: number | null }).rounds ?? 0;
  const { count, error: countError } = await supabase
    .from("rooms")
    .select("id", { count: "exact", head: true })
    .eq("difficulty", difficulty)
    .eq("language", language)
    .eq("state", "lost")
    .not("level", "is", null)
    .not("score", "is", null)
    .or(
      `level.gt.${level},` +
        `and(level.eq.${level},score.lt.${score}),` +
        `and(level.eq.${level},score.eq.${score},rounds.lt.${rounds})`,
    );
  if (countError) return { data: null, error: countError };

  return {
    data: {
      rank: (count ?? 0) + 1,
      name: (room as { name: string }).name,
      score,
      level,
    },
    error: null,
  };
}

// Get weekly top scores for a specific difficulty and language
export async function getWeeklyTopScores(
  difficulty: string,
  language: string,
  startDate: string,
  endDate: string,
  limit = 10,
): Promise<DbResponse<ScoreRecord[]>> {
  return await supabase
    .from("rooms")
    .select("*")
    .eq("difficulty", difficulty)
    .eq("language", language)
    .eq("state", "lost")
    .neq("difficulty", "daily")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .not("level", "is", null)
    .not("score", "is", null)
    .order("level", { ascending: false })
    .order("score", { ascending: true })
    .order("rounds", { ascending: true })
    .order("perfects", { ascending: false })
    .limit(limit);
}

// Insert a new score
export async function insertScore(
  name: string,
  score: number,
  level: number,
  difficulty: string,
  language: string,
  createdAt: string,
  rounds?: number,
  perfects?: number,
): Promise<DbResponse<ScoreRecord[]>> {
  try {
    return await supabase
      .from("rooms")
      .insert([
        {
          name,
          score,
          level,
          difficulty,
          language,
          created_at: createdAt,
          ...(rounds !== undefined && { rounds }),
          ...(perfects !== undefined && { perfects }),
        },
      ])
      .select();
  } catch (error) {
    console.error("Error in insertScore:", error);
    return { data: null, error: error as PostgrestError };
  }
}

// Function to insert a score with the next sequential ID
export async function insertScoreWithNextId(
  name: string,
  score: number,
  level: number,
  difficulty: string,
  language: string,
  createdAt: string,
  rounds: number,
  perfects: number,
): Promise<DbResponse<ScoreRecord[]>> {
  try {
    // Call the Supabase function that handles getting the next ID and inserting the record
    return await supabase.rpc("insert_score_with_next_id", {
      p_name: name,
      p_score: score,
      p_level: level,
      p_difficulty: difficulty,
      p_language: language,
      p_created_at: createdAt,
      p_rounds: rounds,
      p_perfects: perfects,
    });
  } catch (error) {
    console.error("Error in insertScoreWithNextId:", error);
    return { data: null, error: error as PostgrestError };
  }
}
