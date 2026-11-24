import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "wos:keyboard-height";
/** Smaller than this is not a keyboard (e.g. the browser toolbar changing) */
const MIN_KEYBOARD_PX = 150;

function applyHeight(px: number) {
  document.documentElement.style.setProperty("--kb-height", `${px}px`);
}

/**
 * Remembers how tall the device keyboard is (measured with visualViewport
 * when it opens) and exposes it as --kb-height. Until the first measurement
 * the CSS falls back to an estimate; after that it is stable across games.
 * Also undoes any page shift iOS makes when an input gets focus.
 */
function useKeyboardHeight() {
  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (saved > 0) applyHeight(saved);

    // iOS shifts the page while the keyboard animates in/out, so one reset
    // isn't enough: repeat it until the animation is over
    const resetScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
    };
    const timers: number[] = [];
    const keepInPlace = () => {
      resetScroll();
      requestAnimationFrame(resetScroll);
      for (const ms of [100, 300, 600]) {
        timers.push(window.setTimeout(resetScroll, ms));
      }
    };
    const onFocusIn = () => {
      keepInPlace();
      for (const ms of [300, 700]) timers.push(window.setTimeout(measure, ms));
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", keepInPlace);
    // The page itself never scrolls on this screen (lists scroll inside)
    window.addEventListener("scroll", resetScroll, { passive: true });

    const vv = window.visualViewport;
    const measure = () => {
      if (!vv) return;
      // The keyboard covers the layout viewport from the bottom
      const height = Math.round(window.innerHeight - vv.height);
      if (height < MIN_KEYBOARD_PX) return;
      const current = Number(localStorage.getItem(STORAGE_KEY));
      if (Math.abs(height - current) < 8) return;
      localStorage.setItem(STORAGE_KEY, String(height));
      applyHeight(height);
    };
    // iOS may report the size mid-animation (a keyboard only partly open):
    // measure again once the animation is over, or the reserved space stays
    // too short and the board lays out under the keyboard
    const onResize = () => {
      keepInPlace();
      measure();
      for (const ms of [250, 500, 900]) {
        timers.push(window.setTimeout(measure, ms));
      }
    };
    vv?.addEventListener("resize", onResize);
    vv?.addEventListener("scroll", keepInPlace);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", keepInPlace);
      window.removeEventListener("scroll", resetScroll);
      vv?.removeEventListener("resize", onResize);
      vv?.removeEventListener("scroll", keepInPlace);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);
}

interface KeyboardReserveProps {
  /** Focus the word input (opens the device keyboard) */
  onActivate?: () => void;
}

/**
 * Mobile: empty fixed space at the bottom where the device keyboard appears,
 * so opening/closing it doesn't move anything on screen. If the keyboard
 * gets closed, tapping this space opens it again.
 */
export default function KeyboardReserve({ onActivate }: KeyboardReserveProps) {
  const { t } = useTranslation();
  useKeyboardHeight();

  return (
    <button
      type="button"
      className="keyboard-reserve"
      aria-label={t("game.inputWord")}
      tabIndex={-1}
      // Keep the input focused (keyboard open) when tapping here
      onMouseDown={(e) => e.preventDefault()}
      onClick={onActivate}
    >
      {/* Only seen while the keyboard is closed (it covers this space) */}
      <span className="keyboard-reserve__hint">{t("game.tapToType")}</span>
    </button>
  );
}
