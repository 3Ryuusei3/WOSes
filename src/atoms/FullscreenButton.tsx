import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import useMobileLayout from "../hooks/useMobileLayout";
import { isMobileUserAgent } from "../utils/mobileUserAgent";

interface FullscreenButtonProps {
  /** Placement variant (same ones as the sound button) */
  className?: string;
}

// Safari (desktop) still uses the webkit-prefixed API
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

const fsDoc = () => document as FsDocument;
const isFullscreen = () =>
  !!(fsDoc().fullscreenElement ?? fsDoc().webkitFullscreenElement);
const canFullscreen = () =>
  !!(fsDoc().fullscreenEnabled ?? fsDoc().webkitFullscreenEnabled);

/**
 * Full screen on / off. Computers only: phones and narrow windows don't get
 * it (the app is already full screen there, or the browser can't).
 */
export default function FullscreenButton({ className = "" }: FullscreenButtonProps) {
  const { t } = useTranslation();
  const isMobileLayout = useMobileLayout();
  const [active, setActive] = useState(isFullscreen);

  useEffect(() => {
    const onChange = () => setActive(isFullscreen());
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  if (isMobileUserAgent() || isMobileLayout || !canFullscreen()) return null;

  const toggle = async () => {
    try {
      if (isFullscreen()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await fsDoc().webkitExitFullscreen?.();
      } else {
        const root = document.documentElement as FsElement;
        if (root.requestFullscreen) await root.requestFullscreen();
        else await root.webkitRequestFullscreen?.();
      }
    } catch {
      // The browser refused (e.g. not allowed in an iframe): nothing to do
    }
  };

  const label = active ? t("common.exitFullscreen") : t("common.fullscreen");

  return (
    <button
      type="button"
      className={`fullscreen-control btn btn--xs ${className}`}
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {active ? (
          <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        ) : (
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        )}
      </svg>
    </button>
  );
}
