import { useEffect } from "react";

import { roomRealtime, useRoomRealtimeStore } from "../realtime/roomRealtime";

const REQUEST_EVERY_MS = 3000;

/**
 * Player waiting for the host's level summary: asks for it now and every few
 * seconds until it arrives (or the screen changes). The host answers as soon
 * as it gets the request.
 */
export default function useRequestSummary(missing: boolean) {
  const connected = useRoomRealtimeStore((s) => s.connection === "connected");

  useEffect(() => {
    if (!missing || !connected) return;
    roomRealtime.requestSummary();
    const id = setInterval(
      () => roomRealtime.requestSummary(),
      REQUEST_EVERY_MS,
    );
    return () => clearInterval(id);
  }, [missing, connected]);
}
