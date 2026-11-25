import { useEffect } from "react";

import {
  roomRealtime,
  useRoomRealtimeStore,
  type RtSummary,
} from "../realtime/roomRealtime";

const SUMMARY_RESEND_MS = 4000;

/**
 * Host: shares the summary of the level that just ended with everyone in the
 * room (only the host computes it). Resent periodically and whenever someone
 * (re)connects, like the board, so reloads and late joiners catch up.
 * Pass null to send nothing (single player, players, data not ready).
 */
export default function useBroadcastSummary(summary: RtSummary | null) {
  const onlineKeys = useRoomRealtimeStore((s) =>
    Object.keys(s.online).sort().join(","),
  );
  // Serialized so a new object with the same values doesn't restart the timer
  const json = summary ? JSON.stringify(summary) : "";

  useEffect(() => {
    if (!json) return;
    const payload = JSON.parse(json) as RtSummary;
    roomRealtime.sendSummary(payload);
    const id = setInterval(
      () => roomRealtime.sendSummary(payload),
      SUMMARY_RESEND_MS,
    );
    return () => clearInterval(id);
  }, [json, onlineKeys]);
}
