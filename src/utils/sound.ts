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

/** Plays a sound effect from the start, only when the sound is on */
export function playSound(audio: HTMLAudioElement | null | undefined) {
  if (!audio || !isSoundOn()) return;
  try {
    audio.currentTime = 0;
  } catch {
    /* not loaded yet */
  }
  audio.play().catch(() => {});
}
