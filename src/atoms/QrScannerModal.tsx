import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import closeIcon from "../assets/close.svg";
import { roomCodeFromQr } from "../utils/pwa";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called once with the room code read from a room QR */
  onCode: (code: string) => void;
}

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

/** Native QR reader (Chrome / Android); null where it doesn't exist (iOS) */
async function createNativeDetector(): Promise<BarcodeDetectorLike | null> {
  const Detector = (
    window as unknown as {
      BarcodeDetector?: {
        new (opts: { formats: string[] }): BarcodeDetectorLike;
        getSupportedFormats?: () => Promise<string[]>;
      };
    }
  ).BarcodeDetector;
  if (!Detector) return null;
  try {
    const formats = (await Detector.getSupportedFormats?.()) ?? [];
    if (!formats.includes("qr_code")) return null;
    return new Detector({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

/**
 * Scans a room QR with the camera without leaving the app (useful in the
 * installed PWA: the phone's camera app would open the link in the browser).
 */
export default function QrScannerModal({
  isOpen,
  onClose,
  onCode,
}: QrScannerModalProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<
    "starting" | "scanning" | "denied" | "unavailable" | "invalid"
  >("starting");

  useEffect(() => {
    if (!isOpen) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    let invalidTimer: ReturnType<typeof setTimeout> | undefined;
    setStatus("starting");

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err) {
        const name = (err as DOMException)?.name;
        setStatus(
          name === "NotAllowedError" || name === "SecurityError"
            ? "denied"
            : "unavailable",
        );
        return;
      }
      if (stopped) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});
      setStatus("scanning");

      // Native detector if available, otherwise jsQR (loaded only now)
      const native = await createNativeDetector();
      const jsQR = native ? null : (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const tick = async () => {
        if (stopped) return;
        if (video.readyState >= 2 && video.videoWidth > 0) {
          let text: string | null = null;
          if (native) {
            const codes = await native.detect(video).catch(() => []);
            text = codes[0]?.rawValue ?? null;
          } else if (jsQR && ctx) {
            // Downscale: faster and good enough for a QR on a screen
            const scale = Math.min(1, 640 / video.videoWidth);
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
            text =
              jsQR(image.data, image.width, image.height, {
                inversionAttempts: "attemptBoth",
              })?.data ?? null;
          }
          if (text) {
            const code = roomCodeFromQr(text);
            if (code) {
              stopped = true;
              onCode(code);
              return;
            }
            // A QR, but not a room's
            setStatus("invalid");
            clearTimeout(invalidTimer);
            invalidTimer = setTimeout(() => setStatus("scanning"), 1500);
          }
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    void start();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      clearTimeout(invalidTimer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [isOpen, onCode]);

  if (!isOpen) return null;

  const message =
    status === "denied"
      ? t("scanner.denied")
      : status === "unavailable"
        ? t("scanner.unavailable")
        : status === "invalid"
          ? t("scanner.invalid")
          : t("scanner.hint");

  return createPortal(
    <div className="modal open" onClick={onClose} role="presentation">
      <div
        className="modal__content modal__content--steps qr-scanner"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("scanner.title")}
      >
        <button
          type="button"
          className="modal__close btn btn--lost btn--xs"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <img src={closeIcon} alt="close" width={16} height={16} />
        </button>
        <h2 className="won">{t("scanner.title")}</h2>
        <div className="qr-scanner__view">
          {/* playsInline + muted: required to show the camera inline on iOS */}
          <video ref={videoRef} playsInline muted autoPlay />
          <span className="qr-scanner__frame" aria-hidden="true" />
        </div>
        <p
          className={`txt-center ${status === "denied" || status === "invalid" || status === "unavailable" ? "lost" : "highlight"}`}
        >
          {message}
        </p>
        <div className="modal__footer">
          <button
            type="button"
            className="btn modal__primary"
            onClick={onClose}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
