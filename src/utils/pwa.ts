/**
 * True when the game runs as an installed app (PWA added to the home
 * screen), not inside a browser tab.
 * - Android / desktop: display-mode "standalone" (from the manifest)
 * - iOS Safari: navigator.standalone
 */
export function isInstalledPwa(): boolean {
  if (typeof window === "undefined") return false;
  // Only "standalone" (our manifest's display mode): "fullscreen" would
  // also match a normal browser window in full screen
  const standaloneDisplay = window.matchMedia?.(
    "(display-mode: standalone)",
  ).matches;
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(standaloneDisplay || iosStandalone);
}

/**
 * Room code from a scanned QR: the room QR holds the room URL
 * (…/game?id=ABC123); a bare 6-character code is accepted too.
 */
export function roomCodeFromQr(text: string): string | null {
  const value = text.trim();
  try {
    const url = new URL(value);
    const id = url.searchParams.get("id");
    if (id && /^[A-Z0-9]{6}$/i.test(id)) return id.toUpperCase();
  } catch {
    // not a URL
  }
  if (/^[A-Z0-9]{6}$/i.test(value)) return value.toUpperCase();
  return null;
}
