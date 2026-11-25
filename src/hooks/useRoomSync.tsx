import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import useGameStore from "../store/useGameStore";
import useLanguageWords from "./useLanguageWords";
import {
  roomRealtime,
  useRoomRealtimeStore,
  RtCorrectWord,
} from "../realtime/roomRealtime";
import { clearRoomSession } from "../realtime/roomSession";
import { countLetters, canFormWord } from "../utils";
import { showToast } from "../atoms/Toast";
import { START_TIME } from "../constant";
import Difficulty from "../types/Difficulty";
import Word from "../types/Word";

const FINALIZE_SYNC_TIMEOUT_MS = 2500;

export function computePossibleWords(word: string, dictionary: string[]) {
  const lettersCount = countLetters(word);
  return dictionary
    .filter((w) => w.length >= 4 && w.length <= 9)
    .filter((w) => canFormWord(countLetters(w), lettersCount))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
}

function buildLastLevelWords(possible: string[], correct: RtCorrectWord[]): Word[] {
  const byWord = new Map(correct.map((c) => [c.word, c]));
  return possible.map((word) => {
    const c = byWord.get(word);
    return c
      ? ({ word, guessed: true, guessedByName: c.player_name } as Word)
      : { word, guessed: false };
  });
}

export function resetProgress() {
  const s = useGameStore.getState();
  s.setTotalPoints(0);
  s.setLevel(1);
  s.setGameMechanics({
    fake: false,
    hidden: false,
    first: false,
    dark: false,
    still: false,
    mirrored: false,
  });
  s.setGameTime(START_TIME);
  s.setNumberOfPerfectRounds(0);
  s.setNumberOfRounds(0);
  s.setLevelsToAdvance(0);
  s.setPreviousRoundsWords([]);
  s.setRandomWord("");
  s.setPossibleWords([]);
  s.setHiddenLetterIndex(0);
}

/**
 * Montado una sola vez (GamePage). Mantiene la conexión a la sala y aplica
 * el estado del servidor a la app:
 *  - prepara la palabra/posibles palabras de cada ronda
 *  - cambia de pantalla (loading / game / lobby / lost)
 *  - redirige a la nueva sala cuando el host crea una revancha
 *
 * Es idempotente: si se pierde un evento, el siguiente snapshot lleva al
 * mismo resultado.
 */
export default function useRoomSync() {
  const navigate = useNavigate();
  const players = useGameStore((s) => s.players);
  const role = useGameStore((s) => s.role);
  const roomCode = useGameStore((s) => s.roomCode);
  const roomId = useGameStore((s) => s.roomId);
  const playerId = useGameStore((s) => s.playerId);
  const gameDifficulty = useGameStore((s) => s.gameDifficulty);
  const { words } = useLanguageWords(gameDifficulty);

  const room = useRoomRealtimeStore((s) => s.room);
  const round = useRoomRealtimeStore((s) => s.round);
  const rtPlayers = useRoomRealtimeStore((s) => s.players);
  const lastSyncAt = useRoomRealtimeStore((s) => s.lastSyncAt);
  const notFound = useRoomRealtimeStore((s) => s.notFound);

  const appliedKeyRef = useRef("");
  const preparedRoundRef = useRef<number | null>(null);
  const redirectedRef = useRef<string | null>(null);

  // 1. Conexión a la sala
  useEffect(() => {
    if (players === "multi" && roomCode && roomId && playerId && role) {
      roomRealtime.join({
        code: roomCode,
        role,
        playerId,
        name: useGameStore.getState().playerName,
        hostPlays: role === "host" && useGameStore.getState().hostPlays,
      });
    } else {
      roomRealtime.leave();
    }
    appliedKeyRef.current = "";
    preparedRoundRef.current = null;
  }, [players, roomCode, roomId, playerId, role]);

  useEffect(() => () => roomRealtime.leave(), []);

  // Host restored after a reload, but the room is gone -> start screen
  useEffect(() => {
    if (players !== "multi" || role !== "host" || !notFound || !roomCode) return;
    clearRoomSession(roomCode);
    resetProgress();
    const s = useGameStore.getState();
    s.setRole(null);
    s.setRoomId(null);
    s.setPlayerId(null);
    s.setRoomCode("");
    s.setPlayers("single");
    s.setMode("start");
    navigate("/", { replace: true });
    showToast("La sala ya no existe", "warning", 4000);
  }, [notFound, players, role, roomCode, navigate]);

  // Sesión restaurada que el servidor ya no reconoce -> volver a unirse
  useEffect(() => {
    if (players !== "multi" || role !== "player" || !playerId || !roomCode) return;
    const unknownPlayer =
      lastSyncAt > 0 && !rtPlayers.some((p) => p.id === playerId);
    if (!notFound && !unknownPlayer) return;
    clearRoomSession(roomCode);
    const s = useGameStore.getState();
    s.setRoomId(null);
    s.setPlayerId(null);
    s.setRole(null);
    s.setMode("room");
    showToast(
      notFound
        ? "La sala ya no existe"
        : "No se ha podido recuperar tu sesión, vuelve a unirte",
      "warning",
      4000,
    );
  }, [notFound, lastSyncAt, rtPlayers, players, role, playerId, roomCode]);

  // 2. Estado del servidor -> app
  useEffect(() => {
    if (!room || room.code !== roomCode || players !== "multi") return;
    const store = useGameStore.getState();

    // Revancha: el host ha creado una sala nueva
    if (room.new_room_code && store.role === "player") {
      if (redirectedRef.current === room.new_room_code) return;
      redirectedRef.current = room.new_room_code;
      const newCode = room.new_room_code;
      showToast("El anfitrión ha creado una nueva sala", "info", 3000);
      resetProgress();
      store.setMode("room");
      store.setRoomCode(newCode);
      store.setRoomId(null);
      store.setPlayerId(null);
      setTimeout(() => navigate(`/game?id=${newCode}`), 1000);
      return;
    }

    // Dificultad de la sala (el diccionario depende de ella)
    if (
      room.difficulty &&
      room.difficulty !== "daily" &&
      room.difficulty !== store.gameDifficulty
    ) {
      store.setGameDifficulty(room.difficulty as Difficulty);
      return; // esperamos al diccionario de la nueva dificultad
    }

    // Palabra de la ronda activa
    const active = room.state === "loading" || room.state === "game";
    if (active && round && room.current_word && preparedRoundRef.current !== round.id) {
      const alreadySet =
        store.role === "host" &&
        store.randomWord === room.current_word &&
        store.possibleWords.length > 0;
      if (!alreadySet) {
        if (!words || words.length === 0) return; // diccionario aún cargando
        store.setRandomWord(room.current_word);
        store.setPossibleWords(computePossibleWords(room.current_word, words));
        store.setHiddenLetterIndex(
          Math.floor(Math.random() * room.current_word.length),
        );
      }
      preparedRoundRef.current = round.id;
    }

    // Jugador que vuelve (recarga) estando la sala en lobby/fin: necesitamos
    // el diccionario para reconstruir las palabras de la última ronda.
    // (also the host after a reload: it comes back in "room" mode)
    const rejoiningSummary =
      store.mode === "room" &&
      (room.state === "lobby" || room.state === "lost");
    if (rejoiningSummary && (!words || words.length === 0)) return;

    const key = `${room.state}:${round?.id ?? 0}`;
    if (appliedKeyRef.current === key) return;
    appliedKeyRef.current = key;

    switch (room.state) {
      case "loading":
        if (store.mode !== "loading") store.setMode("loading");
        break;
      case "game":
        if (store.mode !== "game") store.setMode("game");
        break;
      case "lobby":
      case "lost": {
        // El host gestiona su propio fin de ronda (puntos, nivel...), salvo
        // al volver tras recargar (está en "room"): entonces se le lleva al
        // resumen como a los jugadores (su progreso viene de la sesión).
        if (store.role !== "player" && store.mode !== "room") break;
        if (!["game", "loading", "room"].includes(store.mode)) break;
        const target = room.state;
        const roundId = round?.id ?? null;
        const roundWord = round?.current_word ?? null;
        void (async () => {
          // Aseguramos tener todas las palabras acertadas antes de mostrarlas
          await Promise.race([
            roomRealtime.resync(),
            new Promise((r) => setTimeout(r, FINALIZE_SYNC_TIMEOUT_MS)),
          ]);
          const rt = useRoomRealtimeStore.getState();
          if (rt.room?.state !== target || (rt.round?.id ?? null) !== roundId) {
            return; // el estado ya ha cambiado; lo aplicará el siguiente ciclo
          }
          const s = useGameStore.getState();
          const correct = roundId ? (rt.wordsByRound[roundId] ?? []) : [];
          // Tras recargar no tenemos las palabras de la ronda: se recalculan
          const possible =
            roundWord && (s.randomWord !== roundWord || s.possibleWords.length === 0)
              ? computePossibleWords(roundWord, words ?? [])
              : s.possibleWords;
          s.setLastLevelWords(buildLastLevelWords(possible, correct));
          s.setLastRoundPoints(0);
          s.setMode(target);
        })();
        break;
      }
      default:
        break;
    }
  }, [room, round, words, roomCode, players, navigate]);
}
