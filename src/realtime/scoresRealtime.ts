/**
 * Canal compartido `scores` (Broadcast desde la BD, evento `score_added`).
 * Sustituye a las suscripciones postgres_changes sobre toda la tabla `rooms`,
 * que recibían cada cambio de estado de cada partida.
 * Varios componentes pueden escuchar a la vez: se comparte un único canal.
 */
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface ScoreAddedPayload {
  difficulty: string | null;
  language: string | null;
  challenge_number: number | null;
}

type Listener = (payload: ScoreAddedPayload) => void;

const listeners = new Set<Listener>();
let channel: RealtimeChannel | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

export function onScoreAdded(listener: Listener): () => void {
  listeners.add(listener);
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }

  if (!channel) {
    channel = supabase
      .channel("scores", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "score_added" }, ({ payload }) => {
        listeners.forEach((l) => l(payload as ScoreAddedPayload));
      })
      .subscribe();
  }

  return () => {
    listeners.delete(listener);
    // Pequeña espera antes de cerrar: al cambiar de pantalla otro componente
    // suele volver a suscribirse enseguida y así reutiliza el mismo canal.
    if (listeners.size === 0 && channel && !closeTimer) {
      closeTimer = setTimeout(() => {
        closeTimer = null;
        if (listeners.size === 0 && channel) {
          const ch = channel;
          channel = null;
          void supabase.removeChannel(ch);
        }
      }, 5000);
    }
  };
}
