import {
  PostgrestError,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type DbResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

export interface RoomRow {
  id: number;
  code: string;
  state: string; // 'preparation' | 'playing' | 'lobby' | 'finished'
  players: string; // 'single' | 'multi'
  current_word?: string | null;
  new_room_code?: string | null;
}

export interface RoomPlayerRow {
  id: number;
  room_id: number;
  name: string;
  score: number;
  last_round_score?: number | null;
  role: "host" | "player";
}

export interface RoomWordRow {
  id: number;
  room_id: number;
  round_id: number | null;
  player_id: number;
  word: string;
  status: "pending" | "correct" | "rejected" | string;
  validated_by?: number | null;
  validated_at?: string | null;
  room_players?: { name: string } | { name: string }[] | null;
}

export async function createRoomWithHost(
  code: string,
  hostName: string,
  difficulty: string,
): Promise<DbResponse<{ room: RoomRow; host: RoomPlayerRow }>> {
  const { data, error } = await supabase.rpc("create_room_with_host", {
    p_code: code,
    p_host_name: hostName,
    p_difficulty: difficulty,
  });

  if (error) return { data: null, error };

  // Expected return: { room_id, code, state, players, host_player_id }
  const payload = data as {
    room_id: number;
    code: string;
    state: string;
    players: string;
    host_player_id: number;
  };

  return {
    data: {
      room: {
        id: payload.room_id,
        code: payload.code,
        state: payload.state,
        players: payload.players,
      },
      host: {
        id: payload.host_player_id,
        room_id: payload.room_id,
        name: hostName,
        score: 0,
        role: "host",
      },
    },
    error: null,
  };
}

export async function joinRoomAsPlayer(
  code: string,
  playerName: string,
): Promise<DbResponse<{ room: RoomRow; player: RoomPlayerRow }>> {
  const { data, error } = await supabase.rpc("join_room_as_player", {
    p_code: code,
    p_player_name: playerName,
  });

  if (error) return { data: null, error };

  const payload = data as {
    room_id: number;
    code: string;
    state: string;
    players: string;
    player_id: number;
    player_name: string;
  };

  return {
    data: {
      room: {
        id: payload.room_id,
        code: payload.code,
        state: payload.state,
        players: payload.players,
      },
      player: {
        id: payload.player_id,
        room_id: payload.room_id,
        name: payload.player_name,
        score: 0,
        role: "player",
      },
    },
    error: null,
  };
}

export async function getRoomPlayers(
  roomId: number,
): Promise<DbResponse<RoomPlayerRow[]>> {
  return await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", roomId)
    .order("id", { ascending: true });
}

type RoomPlayersRealtimePayload = RealtimePostgresChangesPayload<RoomPlayerRow>;

export function subscribeToRoomPlayers(
  roomId: number,
  callback: (payload: RoomPlayersRealtimePayload) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`room-${roomId}-players`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_players",
        filter: `room_id=eq.${roomId}`,
      },
      callback,
    )
    .subscribe();

  return channel;
}

export async function startRoom(code: string): Promise<DbResponse<RoomRow>> {
  const { data, error } = await supabase.rpc("start_room", { p_code: code });
  if (error) return { data: null, error };
  const payload = data as {
    room_id: number;
    code: string;
    state: string;
    players: string;
    current_word?: string | null;
  };
  return {
    data: {
      id: payload.room_id,
      code: payload.code,
      state: payload.state,
      players: payload.players,
      current_word: payload.current_word,
    },
    error: null,
  };
}

type RoomRealtimePayload = RealtimePostgresChangesPayload<RoomRow>;

export function subscribeToRoom(
  roomId: number,
  callback: (payload: RoomRealtimePayload) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`room-${roomId}-state`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      callback,
    )
    .subscribe();

  return channel;
}

export async function advanceRoomToGame(
  code: string,
): Promise<DbResponse<RoomRow>> {
  const { data, error } = await supabase.rpc("advance_room_to_game", {
    p_code: code,
  });
  if (error) return { data: null, error };
  const payload = data as {
    room_id: number;
    code: string;
    state: string;
    players: string;
    current_word?: string | null;
  };
  return {
    data: {
      id: payload.room_id,
      code: payload.code,
      state: payload.state,
      players: payload.players,
      current_word: payload.current_word,
    },
    error: null,
  };
}

export async function startRoomWithWord(
  code: string,
  currentWord: string,
): Promise<DbResponse<RoomRow>> {
  const { data, error } = await supabase.rpc("start_room_with_word", {
    p_code: code,
    p_current_word: currentWord,
  });
  if (error) return { data: null, error };
  const payload = data as {
    room_id: number;
    code: string;
    state: string;
    players: string;
    current_word?: string | null;
    round_id?: number;
  };
  return {
    data: {
      id: payload.room_id,
      code: payload.code,
      state: payload.state,
      players: payload.players,
      current_word: payload.current_word,
    },
    error: null,
  };
}

// Seed all possible words for the new round as pending rows in room_words
export async function seedRoundWords(
  code: string,
  words: string[],
): Promise<DbResponse<{ inserted: number }>> {
  const { data, error } = await supabase.rpc("seed_round_words", {
    p_code: code,
    p_words: words,
  });
  if (error) return { data: null, error };
  return { data: data as any, error: null };
}

// Submit a word (auto validation server-side)
export async function submitWord(
  code: string,
  playerId: number,
  word: string,
  isValid: boolean,
): Promise<DbResponse<{ status: string }>> {
  const { data, error } = await supabase.rpc("submit_word", {
    p_code: code,
    p_player_id: playerId,
    p_word: word,
    p_is_valid: isValid,
  });
  if (error) return { data: null, error };
  return { data: data as any, error: null };
}

// Fetch current correct words for the latest round
export async function getCorrectWords(
  roomId: number,
  roundId?: number,
): Promise<DbResponse<RoomWordRow[]>> {
  const query = supabase
    .from("room_words")
    .select("id,room_id,round_id,player_id,word,status,room_players(name)")
    .eq("room_id", roomId)
    .eq("status", "correct");
  if (roundId) query.eq("round_id", roundId);
  return await query.order("id", { ascending: true });
}

// Fetch all words for a round (pending + correct) to build a consistent board
export async function getRoundWords(
  roomId: number,
  roundId: number,
): Promise<DbResponse<{ word: string; status: string }[]>> {
  const { data, error } = await supabase
    .from("room_words")
    .select("word,status")
    .eq("room_id", roomId)
    .eq("round_id", roundId)
    .order("word", { ascending: true });
  if (error) return { data: null, error };
  return { data: data as any, error: null };
}

type RoomWordsRealtimePayload = RealtimePostgresChangesPayload<RoomWordRow>;

export function subscribeToCorrectWords(
  roomId: number,
  callback: (payload: RoomWordsRealtimePayload) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`room-${roomId}-words`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_words",
        filter: `room_id=eq.${roomId}`,
      },
      callback,
    )
    .subscribe();
  return channel;
}

export async function getPlayerNameById(
  playerId: number,
): Promise<DbResponse<{ name: string }>> {
  const { data, error } = await supabase
    .from("room_players")
    .select("name")
    .eq("id", playerId)
    .single();
  return { data: data as any, error };
}

export async function finishRoundToLobby(
  code: string,
): Promise<DbResponse<RoomRow>> {
  const { data, error } = await supabase.rpc("finish_round_to_lobby", {
    p_code: code,
  });
  if (error) return { data: null, error };
  const payload = data as {
    room_id: number;
    code: string;
    state: string;
    players: string;
  };
  return {
    data: {
      id: payload.room_id,
      code: payload.code,
      state: payload.state,
      players: payload.players,
    },
    error: null,
  };
}

export async function finishRoundToLost(
  code: string,
  level?: number,
  score?: number,
  rounds?: number,
  perfects?: number,
): Promise<DbResponse<RoomRow>> {
  if (
    level !== undefined &&
    score !== undefined &&
    rounds !== undefined &&
    perfects !== undefined
  ) {
    const { data, error } = await supabase.rpc("finish_round_to_lost", {
      p_code: code,
      p_level: level,
      p_score: score,
      p_rounds: rounds,
      p_perfects: perfects,
    });
    if (error) return { data: null, error };
    const payload = data as {
      room_id: number;
      code: string;
      state: string;
      players: string;
    };
    return {
      data: {
        id: payload.room_id,
        code: payload.code,
        state: payload.state,
        players: payload.players,
      },
      error: null,
    };
  }

  // Otherwise use the original function (backward compatibility)
  const { data, error } = await supabase.rpc("finish_round_to_lost", {
    p_code: code,
  });
  if (error) return { data: null, error };
  const payload = data as {
    room_id: number;
    code: string;
    state: string;
    players: string;
  };
  return {
    data: {
      id: payload.room_id,
      code: payload.code,
      state: payload.state,
      players: payload.players,
    },
    error: null,
  };
}

// Helpers to check completion by counting correct words for the latest round
export async function getLatestRoundId(
  roomId: number,
): Promise<DbResponse<number>> {
  const { data, error } = await supabase
    .from("rounds")
    .select("id")
    .eq("room_id", roomId)
    .order("id", { ascending: false })
    .limit(1)
    .single();
  if (error) return { data: null, error };
  return { data: (data as any)?.id as number, error: null };
}

export async function getCorrectCountForRound(
  roomId: number,
  roundId: number,
): Promise<DbResponse<number>> {
  const { data, error } = await supabase
    .from("room_words")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId)
    .eq("round_id", roundId)
    .eq("status", "correct");
  if (error) return { data: null, error };
  // @ts-ignore: count is available on Postgrest response
  return {
    data: (data as any)?.length ?? (data as any)?.count ?? 0,
    error: null,
  };
}

export async function setNewRoomCode(
  oldCode: string,
  newCode: string,
): Promise<
  DbResponse<{ room_id: number; old_code: string; new_room_code: string }>
> {
  const { data, error } = await supabase.rpc("set_new_room_code", {
    p_old_code: oldCode,
    p_new_code: newCode,
  });
  if (error) return { data: null, error };
  return { data: data as any, error: null };
}
