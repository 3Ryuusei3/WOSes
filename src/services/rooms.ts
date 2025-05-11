import { supabase } from '../lib/supabase';
import { PostgrestError, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface ScoreRecord {
  id: number;
  name: string;
  score: number;
  level: number;
  difficulty: string;
  created_at: string;
  updated_at?: string;
}

type DbResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

// Get all-time top scores for a specific difficulty
export async function getAllTimeTopScores(difficulty: string, limit = 10): Promise<DbResponse<ScoreRecord[]>> {
  return await supabase
    .from('rooms')
    .select('*')
    .eq('difficulty', difficulty)
    .order('level', { ascending: false })
    .order('score', { ascending: true })
    .limit(limit);
}

// Get weekly top scores for a specific difficulty
export async function getWeeklyTopScores(
  difficulty: string,
  startDate: string,
  endDate: string,
  limit = 10
): Promise<DbResponse<ScoreRecord[]>> {
  return await supabase
    .from('rooms')
    .select('*')
    .eq('difficulty', difficulty)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('level', { ascending: false })
    .order('score', { ascending: true })
    .limit(limit);
}

// Insert a new score
export async function insertScore(
  name: string,
  score: number,
  level: number,
  difficulty: string,
  createdAt: string
): Promise<DbResponse<ScoreRecord[]>> {
  try {
    return await supabase
      .from('rooms')
      .insert([
        {
          name,
          score,
          level,
          difficulty,
          created_at: createdAt
        }
      ])
      .select();
  } catch (error) {
    console.error('Error in insertScore:', error);
    return { data: null, error: error as PostgrestError };
  }
}

// Function to insert a score with the next sequential ID
export async function insertScoreWithNextId(
  name: string,
  score: number,
  level: number,
  difficulty: string,
  createdAt: string
): Promise<DbResponse<ScoreRecord[]>> {
  try {
    // Call the Supabase function that handles getting the next ID and inserting the record
    return await supabase
      .rpc('insert_score_with_next_id', {
        p_name: name,
        p_score: score,
        p_level: level,
        p_difficulty: difficulty,
        p_created_at: createdAt
      });
  } catch (error) {
    console.error('Error in insertScoreWithNextId:', error);
    return { data: null, error: error as PostgrestError };
  }
}

type ScoreRealtimePayload = RealtimePostgresChangesPayload<{
  id: number;
  name: string;
  score: number;
  level: number;
  difficulty: string;
  created_at: string;
  updated_at?: string;
}>;

// Subscribe to realtime changes on the scores table
export function subscribeToScores(
  callback: (payload: ScoreRealtimePayload) => void,
  difficulty?: string
): RealtimeChannel {
  const channel = supabase
    .channel('rooms-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        ...(difficulty ? { filter: `difficulty=eq.${difficulty}` } : {})
      },
      callback
    )
    .subscribe();

  return channel;
}
