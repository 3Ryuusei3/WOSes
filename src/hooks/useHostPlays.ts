import useGameStore from "../store/useGameStore";
import { useRoomRealtimeStore } from "../realtime/roomRealtime";

/**
 * Room without a main screen: the host plays from its own device like
 * everyone else (it appears in rankings, everyone always sees the board).
 * The host knows it from its own choice; players from its presence (already
 * in the waiting room) or from the board it sends.
 */
export default function useHostPlays(): boolean {
  const role = useGameStore((s) => s.role);
  const ownChoice = useGameStore((s) => s.hostPlays);
  const fromHost = useRoomRealtimeStore(
    (s) => s.board?.host_plays === true || s.hostPlaysPresence,
  );
  return role === "host" ? ownChoice : fromHost;
}
