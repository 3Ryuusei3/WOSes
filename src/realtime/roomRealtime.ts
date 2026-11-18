/**
 * Capa única de tiempo real para las salas multijugador.
 *
 * - Un solo canal por sala: `room:<CODE>` (Broadcast desde la BD + Presence).
 * - La BD es la fuente de verdad: `get_room_snapshot` se pide al conectar,
 *   al reconectar, al volver a la pestaña y periódicamente. Los broadcasts
 *   solo adelantan esa información.
 * - Los componentes NO se suscriben a nada: leen `useRoomRealtimeStore`.
 *
 * Si algún día se cambia el transporte (p. ej. Cloudflare Durable Objects),
 * solo hay que reescribir este archivo manteniendo la misma API/store.
 */
import { create } from "zustand";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type RoomConnection = "idle" | "connecting" | "connected" | "reconnecting";

export interface RtRoom {
  id: number;
  code: string;
  state: string; // room | loading | game | lobby | lost
  current_word: string | null;
  difficulty: string | null;
  language: string | null;
  new_room_code: string | null;
}

export interface RtRound {
  id: number;
  current_word: string;
  started_at: string | null;
  duration_seconds: number | null;
}

export interface RtPlayer {
  id: number;
  name: string;
  score: number;
  last_round_score: number;
  role: "host" | "player";
}

export interface RtCorrectWord {
  round_id: number;
  word: string;
  player_id: number | null;
  player_name: string;
}

interface RoomStatePayload {
  room: RtRoom | null;
  round: RtRound | null;
  server_time: string;
}

interface SnapshotPayload extends RoomStatePayload {
  players: RtPlayer[];
  correct_words: RtCorrectWord[];
}

export interface RoomIdentity {
  code: string;
  role: "host" | "player";
  playerId: number;
  name: string;
}

interface RoomRealtimeState {
  code: string | null;
  connection: RoomConnection;
  /** Desde cuándo (ms locales) no estamos conectados; 0 si conectados */
  disconnectedSince: number;
  room: RtRoom | null;
  round: RtRound | null;
  players: RtPlayer[];
  wordsByRound: Record<number, RtCorrectWord[]>;
  /** Claves de presence conectadas: `host:<id>` / `player:<id>` */
  online: Record<string, true>;
  presenceReady: boolean;
  /** serverTime - localTime, en ms */
  clockOffsetMs: number;
  syncing: boolean;
  /** Hora local del último snapshot correcto (0 = aún ninguno) */
  lastSyncAt: number;
  /** El servidor dice que la sala no existe */
  notFound: boolean;
}

const EMPTY_WORDS: RtCorrectWord[] = [];

const initialState = (): RoomRealtimeState => ({
  code: null,
  connection: "idle",
  disconnectedSince: 0,
  room: null,
  round: null,
  players: [],
  wordsByRound: {},
  online: {},
  presenceReady: false,
  clockOffsetMs: 0,
  syncing: false,
  lastSyncAt: 0,
  notFound: false,
});

export const useRoomRealtimeStore = create<RoomRealtimeState>(initialState);

// ---------------------------------------------------------------------------
// Selectores
// ---------------------------------------------------------------------------
export const selectCurrentRoundWords = (s: RoomRealtimeState) =>
  s.round ? (s.wordsByRound[s.round.id] ?? EMPTY_WORDS) : EMPTY_WORDS;

export const selectHostOnline = (s: RoomRealtimeState) =>
  Object.keys(s.online).some((k) => k.startsWith("host:"));

export const isPlayerOnline = (s: RoomRealtimeState, p: RtPlayer) =>
  !!s.online[`${p.role}:${p.id}`];

/** Convierte una marca de tiempo del servidor (ISO) a ms del reloj local */
export const serverIsoToLocalMs = (iso: string, offsetMs: number) =>
  Date.parse(iso) - offsetMs;

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------
const WATCHDOG_MS = 4000;
const RECREATE_AFTER_MS = 8000;
const PERIODIC_RESYNC_MS = 20000;
const SNAPSHOT_TIMEOUT_MS = 6000;

class RoomRealtimeManager {
  private channel: RealtimeChannel | null = null;
  private identity: RoomIdentity | null = null;
  private watchdog: ReturnType<typeof setInterval> | null = null;
  private resyncPromise: Promise<boolean> | null = null;
  private recreating = false;
  /**
   * realtime-js elimina canales POR TOPIC al cerrarlos: si el canal viejo
   * termina de cerrarse cuando ya existe el nuevo (mismo topic), se llevaría
   * por delante el nuevo. Por eso nunca se solapan: el nuevo se abre cuando
   * esta promesa (cierre del anterior) ha terminado.
   */
  private disposing: Promise<void> = Promise.resolve();
  private generation = 0;
  private bestRtt = Number.POSITIVE_INFINITY;
  /** server_time (ms) del último estado de sala / jugadores aplicado */
  private roomVersion = 0;
  private playersVersion = 0;

  private set = useRoomRealtimeStore.setState;
  private get = useRoomRealtimeStore.getState;

  /** Entra (o permanece) en la sala. Idempotente. */
  join(identity: RoomIdentity) {
    const cur = this.identity;
    if (
      cur &&
      cur.code === identity.code &&
      cur.playerId === identity.playerId &&
      cur.role === identity.role
    ) {
      return;
    }
    this.leave();

    this.identity = identity;
    this.roomVersion = 0;
    this.playersVersion = 0;
    this.bestRtt = Number.POSITIVE_INFINITY;
    this.set({
      ...initialState(),
      code: identity.code,
      connection: "connecting",
      disconnectedSince: Date.now(),
    });

    const gen = ++this.generation;
    void this.disposing.then(() => {
      if (gen === this.generation && this.identity && !this.channel) {
        this.openChannel();
      }
    });
    this.addWakeListeners();
    this.watchdog = setInterval(() => this.tick(), WATCHDOG_MS);
    void this.resync();
  }

  /** Sale de la sala y limpia todo. */
  leave() {
    if (!this.identity && !this.channel) return;
    this.generation++;
    this.removeWakeListeners();
    if (this.watchdog) clearInterval(this.watchdog);
    this.watchdog = null;
    const ch = this.channel;
    this.channel = null;
    this.identity = null;
    if (ch) this.disposing = this.disposeChannel(ch);
    this.set(initialState());
  }

  /**
   * Pide la foto completa de la sala al servidor y la aplica.
   * Devuelve true si se ha podido sincronizar.
   */
  resync(): Promise<boolean> {
    if (!this.identity) return Promise.resolve(false);
    if (this.resyncPromise) return this.resyncPromise;

    const code = this.identity.code;
    this.set({ syncing: true });

    const run = async (): Promise<boolean> => {
      const t0 = Date.now();
      const request = supabase.rpc("get_room_snapshot", { p_code: code });
      const timeout = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(
          () => resolve({ data: null, error: new Error("snapshot timeout") }),
          SNAPSHOT_TIMEOUT_MS,
        ),
      );
      const { data, error } = (await Promise.race([request, timeout])) as {
        data: SnapshotPayload | null;
        error: unknown;
      };
      const t1 = Date.now();

      if (this.identity?.code !== code) return false;
      if (error || !data) {
        if (error) console.warn("[roomRealtime] snapshot failed", error);
        const msg = (error as { message?: string } | null)?.message ?? "";
        if (/room not found/i.test(msg)) this.set({ notFound: true });
        return false;
      }

      this.updateClockOffset(data.server_time, t0, t1);
      this.applyRoomState(data);
      this.applyPlayers(data.players, data.server_time);
      if (data.round) {
        this.mergeWords(data.round.id, data.correct_words ?? []);
      }
      this.set({ lastSyncAt: Date.now(), notFound: false });
      return true;
    };

    this.resyncPromise = run()
      .catch((err) => {
        console.warn("[roomRealtime] resync error", err);
        return false;
      })
      .finally(() => {
        this.resyncPromise = null;
        this.set({ syncing: false });
      });
    return this.resyncPromise;
  }

  /** Fuerza reconexión del socket y del canal + resync. */
  async forceReconnect() {
    if (!this.identity) return;
    if (!supabase.realtime.isConnected()) supabase.realtime.connect();
    await this.recreateChannel();
    await this.resync();
  }

  // -------------------------------------------------------------------------
  // Canal
  // -------------------------------------------------------------------------
  private openChannel() {
    const id = this.identity;
    if (!id) return;

    // supabase.channel() devuelve el canal existente si el topic coincide.
    // No debería quedar ninguno (ver `disposing`), pero por si acaso.
    const topic = `realtime:room:${id.code}`;
    for (const stale of supabase.getChannels().filter((c) => c.topic === topic)) {
      this.forceRemove(stale);
    }

    const ch = supabase.channel(`room:${id.code}`, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: `${id.role}:${id.playerId}`, enabled: true },
      },
    });

    ch.on("broadcast", { event: "room_state" }, ({ payload }) => {
      if (this.channel !== ch) return;
      this.applyRoomState(payload as RoomStatePayload);
    })
      .on("broadcast", { event: "word_correct" }, ({ payload }) => {
        if (this.channel !== ch) return;
        const w = payload as RtCorrectWord;
        if (w?.round_id && w.word) this.mergeWords(w.round_id, [w]);
      })
      .on("broadcast", { event: "players" }, ({ payload }) => {
        if (this.channel !== ch) return;
        const p = payload as { players: RtPlayer[]; server_time: string };
        this.applyPlayers(p.players, p.server_time);
      })
      .on("presence", { event: "sync" }, () => {
        if (this.channel !== ch) return;
        const online: Record<string, true> = {};
        for (const key of Object.keys(ch.presenceState())) online[key] = true;
        this.set({ online, presenceReady: true });
      })
      .subscribe((status) => {
        if (this.channel !== ch) return;
        if (status === "SUBSCRIBED") {
          this.set({ connection: "connected", disconnectedSince: 0 });
          void ch.track({
            role: id.role,
            playerId: id.playerId,
            name: id.name,
            at: Date.now(),
          });
          // Nos hemos podido perder eventos mientras no estábamos unidos
          void this.resync();
        } else {
          // CHANNEL_ERROR / TIMED_OUT: realtime-js reintenta solo.
          // CLOSED: lo recrea el watchdog.
          this.markDisconnected();
        }
      });

    this.channel = ch;
  }

  private markDisconnected() {
    const s = this.get();
    if (s.connection === "connected" || s.connection === "idle") {
      this.set({ connection: "reconnecting", disconnectedSince: Date.now() });
    } else if (!s.disconnectedSince) {
      this.set({ disconnectedSince: Date.now() });
    }
  }

  private async disposeChannel(ch: RealtimeChannel) {
    try {
      // Sin red el unsubscribe puede tardar mucho: no esperamos más de 3 s
      await Promise.race([
        supabase.removeChannel(ch),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch {
      /* ignore */
    }
    // Si el unsubscribe no se confirmó, lo sacamos a mano para que
    // supabase.channel(topic) no nos devuelva este canal muerto.
    if (supabase.getChannels().includes(ch)) {
      this.forceRemove(ch);
    }
  }

  private forceRemove(ch: RealtimeChannel) {
    try {
      ch.teardown();
    } catch {
      /* ignore */
    }
    const rt = supabase.realtime as unknown as {
      _remove?: (c: RealtimeChannel) => void;
    };
    rt._remove?.(ch);
  }

  private async recreateChannel() {
    if (this.recreating || !this.identity) return;
    this.recreating = true;
    const gen = this.generation;
    try {
      const old = this.channel;
      this.channel = null;
      if (old) {
        this.disposing = this.disposeChannel(old);
      }
      await this.disposing;
      if (gen === this.generation && this.identity && !this.channel) {
        this.openChannel();
      }
    } finally {
      this.recreating = false;
    }
  }

  // -------------------------------------------------------------------------
  // Watchdog y eventos del navegador
  // -------------------------------------------------------------------------
  private tick() {
    if (!this.identity) return;
    if (typeof document !== "undefined" && document.hidden) return;

    // Autocuración: el canal ya no está registrado en el cliente
    if (this.channel && !this.recreating && !supabase.getChannels().includes(this.channel)) {
      this.markDisconnected();
      void this.recreateChannel();
    }

    const s = this.get();
    if (s.connection !== "connected") {
      if (!supabase.realtime.isConnected()) supabase.realtime.connect();
      if (s.disconnectedSince && Date.now() - s.disconnectedSince > RECREATE_AFTER_MS) {
        this.set({ disconnectedSince: Date.now() });
        void this.recreateChannel();
      }
      // Mientras el WebSocket no va, seguimos el juego por HTTP
      void this.resync();
      return;
    }

    if (Date.now() - s.lastSyncAt > PERIODIC_RESYNC_MS) void this.resync();
  }

  private onWake = () => {
    if (!this.identity) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (!supabase.realtime.isConnected()) supabase.realtime.connect();
    const state = this.channel?.state;
    if (!this.channel || state === "closed" || state === "errored") {
      void this.recreateChannel();
    }
    void this.resync();
  };

  private onOffline = () => this.markDisconnected();

  private addWakeListeners() {
    if (typeof window === "undefined") return;
    document.addEventListener("visibilitychange", this.onWake);
    window.addEventListener("online", this.onWake);
    window.addEventListener("pageshow", this.onWake);
    window.addEventListener("focus", this.onWake);
    window.addEventListener("offline", this.onOffline);
  }

  private removeWakeListeners() {
    if (typeof window === "undefined") return;
    document.removeEventListener("visibilitychange", this.onWake);
    window.removeEventListener("online", this.onWake);
    window.removeEventListener("pageshow", this.onWake);
    window.removeEventListener("focus", this.onWake);
    window.removeEventListener("offline", this.onOffline);
  }

  // -------------------------------------------------------------------------
  // Aplicación de datos
  // -------------------------------------------------------------------------
  private updateClockOffset(serverIso: string, t0: number, t1: number) {
    const serverMs = Date.parse(serverIso);
    if (Number.isNaN(serverMs)) return;
    const rtt = t1 - t0;
    // Nos quedamos con las muestras de menor latencia (más precisas)
    if (rtt <= this.bestRtt * 1.5 + 50) {
      this.bestRtt = Math.min(this.bestRtt, rtt);
      this.set({ clockOffsetMs: serverMs - (t0 + rtt / 2) });
    }
  }

  private applyRoomState(p: RoomStatePayload) {
    if (!p?.room || p.room.code !== this.identity?.code) return;
    const version = Date.parse(p.server_time) || 0;
    if (version < this.roomVersion) return; // llegó tarde: hay uno más nuevo
    this.roomVersion = version;

    const s = this.get();
    const roundChanged = (p.round?.id ?? null) !== (s.round?.id ?? null);
    let wordsByRound = s.wordsByRound;
    if (roundChanged && p.round) {
      // Conservamos solo la ronda actual (y posteriores, por si llegaron antes)
      wordsByRound = {};
      for (const [k, v] of Object.entries(s.wordsByRound)) {
        if (Number(k) >= p.round.id) wordsByRound[Number(k)] = v;
      }
    }
    this.set({ room: p.room, round: p.round, wordsByRound });
  }

  private applyPlayers(players: RtPlayer[] | undefined, serverIso: string) {
    if (!Array.isArray(players)) return;
    const version = Date.parse(serverIso) || 0;
    if (version < this.playersVersion) return;
    this.playersVersion = version;
    this.set({ players });
  }

  private mergeWords(roundId: number, incoming: RtCorrectWord[]) {
    if (incoming.length === 0) return;
    const s = this.get();
    const current = s.wordsByRound[roundId] ?? EMPTY_WORDS;
    const known = new Set(current.map((w) => w.word));
    const added = incoming.filter((w) => !known.has(w.word));
    if (added.length === 0) return;
    this.set({
      wordsByRound: { ...s.wordsByRound, [roundId]: [...current, ...added] },
    });
  }
}

export const roomRealtime = new RoomRealtimeManager();
