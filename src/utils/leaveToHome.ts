import type { NavigateFunction } from "react-router-dom";

import useGameStore from "../store/useGameStore";
import { clearRoomSession, markRoomLeft } from "../realtime/roomSession";
import { resetProgress } from "../hooks/useRoomSync";
import { leaveRoom } from "../services/multiplayer";

/** Inside a room (joined as a player, or as its host) */
export function isInRoom(): boolean {
  const s = useGameStore.getState();
  return s.players === "multi" && !!s.role && !!s.roomId;
}

/** Leaving would lose something: a run in progress, or a room */
export function needsExitConfirm(): boolean {
  const s = useGameStore.getState();
  if (isInRoom()) return true;
  // Join form (not in the room yet) or a finished solo game
  return s.mode !== "room" && s.mode !== "lost";
}

/**
 * Back to the start screen. A player leaving a room is removed from it, so
 * it disappears from everyone's players list.
 */
export function leaveToHome(navigate: NavigateFunction) {
  const s = useGameStore.getState();
  s.setExitConfirmOpen(false);
  if (s.players === "multi" && s.roomCode) {
    if (isInRoom()) {
      if (s.role === "player" && s.playerId) {
        void leaveRoom(s.roomCode, s.playerId).catch(() => {});
      }
      // An old link to this room in the history must not reopen it
      markRoomLeft(s.roomCode);
    }
    clearRoomSession(s.roomCode);
  }
  resetProgress();
  // Without a room useRoomSync leaves the realtime channel by itself
  s.setRole(null);
  s.setRoomCode("");
  s.setRoomId(null);
  s.setPlayerId(null);
  s.setPlayers("single");
  s.setDailyChallengeOriginalDifficulty(null);
  navigate("/", { replace: true });
  s.setMode("start");
}

/** "Back" (our button or the browser's): ask first when needed */
export function requestExit(navigate: NavigateFunction) {
  if (needsExitConfirm()) useGameStore.getState().setExitConfirmOpen(true);
  else leaveToHome(navigate);
}
