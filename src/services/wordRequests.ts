import { supabase } from "../lib/supabase";

export type DbResponse<T> = {
  data: T | null;
  error: any;
};

interface WordRequestParams {
  word: string;
  difficulty: string;
  originalWord: string;
  action: "add" | "remove";
  roomName?: string;
}

export async function submitWordRequest(
  params: WordRequestParams,
): Promise<DbResponse<any>> {
  const { data, error } = await supabase.from("requests").insert([
    {
      word: params.word,
      difficulty: params.difficulty,
      original_word: params.originalWord,
      action: params.action,
      state: "to_do",
      room_name: params.roomName || null,
    },
  ]);

  return { data, error };
}

interface FeedbackParams {
  message: string;
  difficulty?: string;
  roomName?: string;
}

/**
 * General platform feedback (ideas, bugs…). Same `requests` table with
 * type = 'feedback' and the text in `message` (see migration
 * 20261124120000_requests_feedback.sql, which must be applied first).
 */
export async function submitFeedback(
  params: FeedbackParams,
): Promise<DbResponse<any>> {
  const { data, error } = await supabase.from("requests").insert([
    {
      type: "feedback",
      message: params.message,
      difficulty: params.difficulty || null,
      state: "to_do",
      room_name: params.roomName || null,
    },
  ]);

  return { data, error };
}
