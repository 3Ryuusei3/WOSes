import { useState } from "react";

import useGameStore from "../store/useGameStore";
import { joinRoomAsPlayer } from "../services/multiplayer";
import { saveRoomSession, unmarkRoomLeft } from "../realtime/roomSession";

/**
 * Join a room as a player (shared by the room screen and the start screen).
 * On success the player identity is stored (role, ids, session) so the room
 * screen / realtime sync pick it up.
 */
export default function useJoinRoom() {
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const join = async (code: string, name: string): Promise<boolean> => {
    setJoinError(null);
    setJoining(true);
    try {
      const { data, error } = await joinRoomAsPlayer(code, name);
      if (error || !data) {
        setJoinError(error?.message || "No se puede acceder a la sala");
        return false;
      }
      const s = useGameStore.getState();
      s.setRoomCode(code);
      s.setRole("player");
      s.setRoomId(data.room.id);
      s.setPlayerId(data.player.id);
      s.setPlayers("multi");
      saveRoomSession({
        code,
        roomId: data.room.id,
        playerId: data.player.id,
        name,
        role: "player",
      });
      unmarkRoomLeft(code);
      // The difficulty and the room state arrive with the snapshot
      return true;
    } catch {
      setJoinError("Error al intentar unirse a la sala");
      return false;
    } finally {
      setJoining(false);
    }
  };

  return { join, joining, joinError, setJoinError };
}
