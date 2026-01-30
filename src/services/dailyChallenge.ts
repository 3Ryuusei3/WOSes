import { supabase } from "../lib/supabase";
import {
  DailyChallenge,
  DailyChallengeRankingEntry,
} from "../types/DailyChallenge";

export const getDailyChallenge = async (): Promise<{
  data: DailyChallenge | null;
  error: any;
}> => {
  const { data, error } = await supabase.rpc("get_daily_challenge");

  if (error) return { data: null, error };
  if (!data || data.length === 0)
    return { data: null, error: "No challenge found" };

  return { data: data[0], error: null };
};

export const saveDailyChallengeScore = async (params: {
  name: string;
  score: number;
  challenge_number: number;
  time_elapsed: number;
  language: string;
  perfects: number;
}) => {
  const { data, error } = await supabase.rpc("insert_daily_challenge_score", {
    p_name: params.name,
    p_score: params.score,
    p_challenge_number: params.challenge_number,
    p_time_elapsed: params.time_elapsed,
    p_language: params.language,
    p_created_at: new Date().toISOString(),
    p_perfects: params.perfects,
  });

  return { data, error };
};

export const getDailyChallengeRanking = async (
  challengeNumber: number
): Promise<{ data: DailyChallengeRankingEntry[] | null; error: any }> => {
  const { data, error } = await supabase.rpc("get_daily_challenge_ranking", {
    p_challenge_number: challengeNumber,
  });

  return { data, error };
};

export const checkIfAlreadyPlayed = async (
  playerName: string,
  challengeNumber: number
): Promise<boolean> => {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("rooms")
    .select("id")
    .eq("name", playerName)
    .eq("difficulty", "daily")
    .eq("challenge_number", challengeNumber)
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`)
    .limit(1);

  return !error && data && data.length > 0;
};

export const subscribeToDailyChallengeRanking = (
  callback: () => void,
  challengeNumber: number
) => {
  const channel = supabase
    .channel("daily_challenge_ranking")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "rooms",
        filter: `difficulty=eq.daily,challenge_number=eq.${challengeNumber}`,
      },
      callback
    )
    .subscribe();

  return channel;
};
