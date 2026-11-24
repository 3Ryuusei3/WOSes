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

    const keepInPlace = () => {
      requestAnimationFrame(() => window.scrollTo(0, 0));
    };
    document.addEventListener("focusin", keepInPlace);

    const vv = window.visualViewport;
    const onResize = () => {
      if (!vv) return;
      keepInPlace();
      // The keyboard covers the layout viewport from the bottom
      const height = Math.round(window.innerHeight - vv.height);
      if (height < MIN_KEYBOARD_PX) return;
      const current = Number(localStorage.getItem(STORAGE_KEY));
      if (Math.abs(height - current) < 8) return;
      localStorage.setItem(STORAGE_KEY, String(height));
      applyHeight(height);
    };
    vv?.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("focusin", keepInPlace);
      vv?.removeEventListener("resize", onResize);
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
    />
  );
}
