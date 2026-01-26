import { useEffect, useState, useRef, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

interface UseRealtimeConnectionOptions {
  onReconnect?: () => void;
  onDisconnect?: () => void;
  maxRetries?: number;
  retryDelay?: number;
}

interface UseRealtimeConnectionReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  retryCount: number;
  forceReconnect: () => void;
}

// Variable global para rastrear el estado de conexión compartido
let globalConnectionStatus: ConnectionStatus = "connected";
const listeners = new Set<(status: ConnectionStatus) => void>();
let globalChannel: RealtimeChannel | null = null;

export default function useRealtimeConnection(
  options: UseRealtimeConnectionOptions = {},
): UseRealtimeConnectionReturn {
  const {
    onReconnect,
    onDisconnect,
    maxRetries = 10,
    retryDelay = 1000,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>(
    globalConnectionStatus,
  );
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onReconnectRef = useRef(onReconnect);
  const onDisconnectRef = useRef(onDisconnect);
  const hasCalledReconnectRef = useRef(false);

  // Mantener refs actualizadas
  useEffect(() => {
    onReconnectRef.current = onReconnect;
    onDisconnectRef.current = onDisconnect;
  }, [onReconnect, onDisconnect]);

  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    globalConnectionStatus = newStatus;
    listeners.forEach((listener) => listener(newStatus));
  }, []);

  const attemptReconnect = useCallback(() => {
    if (retryCount >= maxRetries) {
      updateStatus("error");
      return;
    }

    updateStatus("reconnecting");
    setRetryCount((prev) => prev + 1);

    // Exponential backoff: 1s, 2s, 4s, 8s, etc. (max 30s)
    const delay = Math.min(retryDelay * Math.pow(2, retryCount), 30000);

    retryTimeoutRef.current = setTimeout(() => {
      // Try to subscribe to a test channel to check connection
      const testChannel = supabase
        .channel(`connection-test-${Date.now()}`)
        .on("broadcast", { event: "test" }, () => {})
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            updateStatus("connected");
            setRetryCount(0);
            testChannel.unsubscribe();

            // Llamar onReconnect de todas las instancias
            listeners.forEach(() => {
              listeners.forEach(() => {});
            });

            // Notificar reconexión a este componente específico
            if (onReconnectRef.current && !hasCalledReconnectRef.current) {
              hasCalledReconnectRef.current = true;
              onReconnectRef.current();
              setTimeout(() => {
                hasCalledReconnectRef.current = false;
              }, 1000);
            }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            testChannel.unsubscribe();
            attemptReconnect();
          }
        });
    }, delay);
  }, [retryCount, maxRetries, retryDelay, updateStatus]);

  const forceReconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setRetryCount(0);
    attemptReconnect();
  }, [attemptReconnect]);

  useEffect(() => {
    // Registrar este componente como listener
    const statusListener = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);

      if (newStatus === "connected" && !hasCalledReconnectRef.current) {
        hasCalledReconnectRef.current = true;
        onReconnectRef.current?.();
        setTimeout(() => {
          hasCalledReconnectRef.current = false;
        }, 1000);
      } else if (newStatus === "disconnected") {
        onDisconnectRef.current?.();
      }
    };

    listeners.add(statusListener);

    // Solo crear el canal monitor global una vez
    if (!globalChannel) {
      globalChannel = supabase
        .channel("connection-monitor-global")
        .on("system", {}, (payload: any) => {
          if (
            payload.status === "CHANNEL_ERROR" ||
            payload.status === "TIMED_OUT"
          ) {
            if (
              globalConnectionStatus !== "reconnecting" &&
              globalConnectionStatus !== "disconnected"
            ) {
              updateStatus("disconnected");
              attemptReconnect();
            }
          } else if (
            payload.status === "SUBSCRIBED" &&
            globalConnectionStatus !== "connected"
          ) {
            updateStatus("connected");
            setRetryCount(0);
          }
        })
        .subscribe();
    }

    return () => {
      listeners.delete(statusListener);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Solo limpiar el canal global si no hay más listeners
      if (listeners.size === 0 && globalChannel) {
        globalChannel.unsubscribe();
        globalChannel = null;
      }
    };
  }, [updateStatus, attemptReconnect]);

  return {
    status,
    isConnected: status === "connected",
    retryCount,
    forceReconnect,
  };
}
