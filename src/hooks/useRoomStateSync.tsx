import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Hook para sincronización manual del estado de la sala
 * SOLO se usa cuando el usuario presiona el botón de reconexión
 * NO hace polling automático
 */
export default function useRoomStateSync(
  roomId: number | null,
  onStateChange: (newState: {
    state?: string;
    current_word?: string;
    difficulty?: string;
  }) => void,
) {
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Sincroniza manualmente el estado desde el servidor
   */
  const syncNow = useCallback(async () => {
    if (!roomId || isSyncing) return;

    setIsSyncing(true);

    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("state, current_word, difficulty")
        .eq("id", roomId)
        .single();

      if (error) {
        console.error("[RoomSync] Error fetching room state:", error);
        return;
      }

      if (data) {
        onStateChange(data);
      }
    } catch (err) {
      console.error("[RoomSync] Exception during sync:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [roomId, isSyncing, onStateChange]);

  return {
    syncNow,
    isSyncing,
  };
}
