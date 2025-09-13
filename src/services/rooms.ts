import { supabase } from '../lib/supabase';
import { PostgrestError, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface ScoreRecord {
  id: number;
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
export async function getAllTimeTopScores(difficulty: string, language: string, limit = 10): Promise<DbResponse<ScoreRecord[]>> {
  return await supabase
    .from('rooms')
    .select('*')
    .eq('difficulty', difficulty)
    .eq('language', language)
    .not('level', 'is', null)
    .not('score', 'is', null)
    .order('level', { ascending: false })
    .order('rounds', { ascending: false })
    .order('perfects', { ascending: false })
    .order('score', { ascending: false })
    .limit(limit);
}

// Get weekly top scores for a specific difficulty and language
export async function getWeeklyTopScores(
  difficulty: string,
  language: string,
  startDate: string,
  endDate: string,
  limit = 10
): Promise<DbResponse<ScoreRecord[]>> {
  return await supabase
    .from('rooms')
    .select('*')
    .eq('difficulty', difficulty)
    .eq('language', language)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .not('level', 'is', null)
    .not('score', 'is', null)
    .order('level', { ascending: false })
    .order('rounds', { ascending: false })
    .order('perfects', { ascending: false })
    .order('score', { ascending: false })
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
  perfects?: number
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
          language,
          created_at: createdAt,
          ...(rounds !== undefined && { rounds }),
          ...(perfects !== undefined && { perfects })
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
  language: string,
  createdAt: string,
  rounds: number,
  perfects: number
): Promise<DbResponse<ScoreRecord[]>> {
  try {
    // Call the Supabase function that handles getting the next ID and inserting the record
    return await supabase
      .rpc('insert_score_with_next_id', {
        p_name: name,
        p_score: score,
        p_level: level,
        p_difficulty: difficulty,
        p_language: language,
        p_created_at: createdAt,
        p_rounds: rounds,
        p_perfects: perfects
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
  language: string;
  created_at: string;
  updated_at?: string;
}>;

// Subscribe to realtime changes on the scores table
export function subscribeToScores(
  callback: (payload: ScoreRealtimePayload) => void,
  difficulty?: string,
  language?: string
): RealtimeChannel {
  // Build filter string for multiple conditions
  let filter = '';
  if (difficulty && language) {
    filter = `difficulty=eq.${difficulty},language=eq.${language}`;
  } else if (difficulty) {
    filter = `difficulty=eq.${difficulty}`;
  } else if (language) {
    filter = `language=eq.${language}`;
  }

  const channel = supabase
    .channel('rooms-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        ...(filter ? { filter } : {})
      },
      callback
    )
    .subscribe();

  return channel;
}
