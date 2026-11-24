import { isMobileUserAgent } from "./mobileUserAgent";

/**
 * iOS only opens the keyboard when an input is focused during a user tap,
 * so the word input can't open it by itself when the round starts.
 *
 * Trick: on the tap that starts the game ("Empezar partida", "Jugar al
 * nivel X") we focus this hidden input, which opens the keyboard. When the
 * game screen mounts, the word input takes the focus (moving focus between
 * inputs while the keyboard is open is allowed) and the keyboard stays.
 * Android doesn't need it but it's harmless there.
 */
let proxy: HTMLInputElement | null = null;

export function primeMobileKeyboard() {
  if (typeof document === "undefined" || !isMobileUserAgent()) return;
  if (!proxy) {
    proxy = document.createElement("input");
    proxy.type = "text";
    proxy.tabIndex = -1;
    proxy.autocomplete = "off";
    proxy.setAttribute("aria-hidden", "true");
    // 16px: iOS zooms into inputs with a smaller font
    Object.assign(proxy.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "1px",
      height: "1px",
      opacity: "0",
      fontSize: "16px",
      border: "0",
      padding: "0",
      pointerEvents: "none",
    });
    document.body.appendChild(proxy);
  }
  proxy.focus({ preventScroll: true });
}
