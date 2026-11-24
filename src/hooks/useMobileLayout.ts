import { useEffect, useState } from "react";

import { isMobileUserAgent } from "../utils/mobileUserAgent";

/** Narrow windows (e.g. a resized desktop browser) also get the mobile layout */
const NARROW_QUERY = "(max-width: 767px)";

/**
 * Mobile LAYOUT: phones, or any window narrower than 768px. Updates live
 * when the window is resized.
 *
 * Not the same as useMobileUserAgent, which is about the DEVICE: keep using
 * that one for touch-keyboard things (reserved keyboard space, focus tricks),
 * since a narrow desktop window has no on-screen keyboard.
 */
export function isMobileLayout(): boolean {
  if (typeof window === "undefined") return false;
  return isMobileUserAgent() || window.matchMedia(NARROW_QUERY).matches;
}

export default function useMobileLayout(): boolean {
  const [mobile, setMobile] = useState(isMobileLayout);

  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY);
    const update = () => setMobile(isMobileLayout());
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return mobile;
}
