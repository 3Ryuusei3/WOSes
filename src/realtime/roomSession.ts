/**
 * Recuerda la identidad del jugador en una sala para poder volver tras
 * recargar la página o reabrir el enlace, sin crear un jugador nuevo.
 *
 * - sessionStorage: sobrevive a recargas y es propio de cada pestaña
 *   (dos pestañas del mismo navegador no se pisan).
 * - localStorage: respaldo para cuando el móvil cierra la pestaña y el
 *   jugador vuelve a abrir el enlace.
 * La validez real la decide el servidor: si el jugador ya no existe en la
 * sala (o la sala no existe), la sesión se descarta.
 */
export interface RoomSession {
  code: string;
  roomId: number;
  playerId: number;
  name: string;
  savedAt: number;
}

const KEY = "woses-room-session";
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 h

function read(storage: Storage | undefined): RoomSession | null {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as RoomSession;
    if (!s?.code || !s.playerId || !s.roomId) return null;
    if (Date.now() - (s.savedAt ?? 0) > MAX_AGE_MS) return null;
    return s;
  } catch {
    return null;
  }
}

const storages = (): (Storage | undefined)[] => {
  if (typeof window === "undefined") return [];
  const out: (Storage | undefined)[] = [];
  try {
    out.push(window.sessionStorage);
  } catch {
    /* bloqueado */
  }
  try {
    out.push(window.localStorage);
  } catch {
    /* bloqueado */
  }
  return out;
};

export function loadRoomSession(code: string): RoomSession | null {
  for (const st of storages()) {
    const s = read(st);
    if (s && s.code === code) return s;
  }
  return null;
}

export function saveRoomSession(session: Omit<RoomSession, "savedAt">) {
  const value = JSON.stringify({ ...session, savedAt: Date.now() });
  for (const st of storages()) {
    try {
      st?.setItem(KEY, value);
    } catch {
      /* cuota / modo privado */
    }
  }
}

export function clearRoomSession(code?: string) {
  for (const st of storages()) {
    try {
      const s = read(st);
      if (!code || !s || s.code === code) st?.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
}
