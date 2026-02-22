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
    },
  ]);

  return { data, error };
}
