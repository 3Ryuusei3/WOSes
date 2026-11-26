import useGameStore from "../store/useGameStore";

/**
 * Sound on/off. iOS ignores HTMLAudioElement.volume (it always plays at the
 * device volume), so "off" must mean "don't play at all", not volume 0.
 */
export function isSoundOn(): boolean {
  const { volume, players, role } = useGameStore.getState();
  // Players in a room are always silent (the host's screen has the sound)
  if (players === "multi" && role === "player") return false;
  return volume > 0;
}

/*
 * Effects go through the Web Audio API: each sound is decoded once and then
 * played from memory. Playing (and rewinding) an <audio> element for every
 * word made phones stutter, iOS above all (typing and sending words got
 * slow with the sound on). The <audio> element is only the fallback while a
 * sound is still loading or where Web Audio isn't available.
 */
type AudioContextClass = typeof AudioContext;
let context: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<void>>();

function getContext(): AudioContext | null {
  if (context) return context;
  if (typeof window === "undefined") return null;
  const Ctx: AudioContextClass | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextClass })
      .webkitAudioContext;
  if (!Ctx) return null;
  try {
    context = new Ctx();
  } catch {
    return null;
  }
  return context;
}

// Browsers start audio "suspended" until a tap / key: wake it up then.
// iOS: play like media (as the <audio> music does), not muted by the
// silent switch only for the effects.
if (typeof window !== "undefined") {
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  try {
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* not supported */
  }
  const wake = () => {
    const ctx = getContext();
    if (ctx && ctx.state !== "running") void ctx.resume().catch(() => {});
  };
  for (const ev of ["pointerdown", "keydown", "touchend"]) {
    window.addEventListener(ev, wake, { capture: true, passive: true });
  }
}

// Same key for "/assets/hit.mp3" and its full URL (audio.src is absolute)
const keyOf = (src: string) => {
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return src;
  }
};

/** Decodes a sound in advance so its first play is already instant */
export function preloadSound(url: string) {
  const src = keyOf(url);
  const ctx = getContext();
  if (!ctx || buffers.has(src) || loading.has(src)) return;
  const job = fetch(src)
    .then((r) => r.arrayBuffer())
    .then(
      (data) =>
        new Promise<AudioBuffer>((resolve, reject) =>
          // Callback form: older Safari has no promise version
          ctx.decodeAudioData(data, resolve, reject),
        ),
    )
    .then((buffer) => {
      buffers.set(src, buffer);
    })
    .catch(() => {})
    .finally(() => loading.delete(src));
  loading.set(src, job);
}

/** Plays a sound effect from the start, only when the sound is on */
export function playSound(audio: HTMLAudioElement | null | undefined) {
  if (!audio || !isSoundOn()) return;
  const src = audio.src ? keyOf(audio.src) : "";
  const ctx = getContext();
  if (ctx && src) {
    const buffer = buffers.get(src);
    if (buffer) {
      if (ctx.state !== "running") void ctx.resume().catch(() => {});
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(1, audio.volume));
      source.connect(gain).connect(ctx.destination);
      source.start();
      return;
    }
    preloadSound(src);
  }
  try {
    audio.currentTime = 0;
  } catch {
    /* not loaded yet */
  }
  audio.play().catch(() => {});
}
