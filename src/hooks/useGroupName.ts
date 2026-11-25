import useGameStore from "../store/useGameStore";
import { useRoomRealtimeStore } from "../realtime/roomRealtime";
import useHostPlays from "./useHostPlays";

/**
 * Name of the group in a room where everyone plays on their device (it is the
 * game's name in the global ranking). null with a main screen: there the
 * room's name is just the host's. Players get it from the room state.
 */
export default function useGroupName(): string | null {
  const hostPlays = useHostPlays();
  const role = useGameStore((s) => s.role);
  const ownGroupName = useGameStore((s) => s.groupName);
  const roomName = useRoomRealtimeStore((s) => s.room?.name ?? null);

  if (!hostPlays) return null;
  if (role === "host") return roomName || ownGroupName || null;
  return roomName || null;
}
