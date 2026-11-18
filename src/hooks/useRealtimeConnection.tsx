import { useCallback } from "react";
import { roomRealtime, useRoomRealtimeStore } from "../realtime/roomRealtime";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

/**
 * Estado de la conexión en tiempo real de la sala actual.
 * Toda la lógica de conexión vive en `roomRealtime`; esto solo la expone.
 */
export default function useRealtimeConnection() {
  const connection = useRoomRealtimeStore((s) => s.connection);
  const isSyncing = useRoomRealtimeStore((s) => s.syncing);

  const status: ConnectionStatus =
    connection === "reconnecting" ? "reconnecting" : "connected";

  const syncNow = useCallback(() => {
    void roomRealtime.resync();
  }, []);

  const forceReconnect = useCallback(() => {
    void roomRealtime.forceReconnect();
  }, []);

  return {
    status,
    isConnected: status === "connected",
    isSyncing,
    syncNow,
    forceReconnect,
  };
}
