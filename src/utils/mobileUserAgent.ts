export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile\b|CriOS|Silk\b/i.test(
    ua,
  );
}
