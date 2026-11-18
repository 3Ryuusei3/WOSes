import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useGameStore from '../store/useGameStore';
import {
  useRoomRealtimeStore,
  selectHostOnline,
} from '../realtime/roomRealtime';

// Evita parpadeos: solo avisamos si el problema dura un poco
const SHOW_RECONNECTING_AFTER_MS = 2000;
const SHOW_HOST_OFFLINE_AFTER_MS = 4000;

function useDelayedFlag(active: boolean, delayMs: number) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const t = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(t);
  }, [active, delayMs]);
  return shown;
}

export default function ConnectionStatus() {
  const { t } = useTranslation();
  const role = useGameStore((s) => s.role);
  const connection = useRoomRealtimeStore((s) => s.connection);
  const presenceReady = useRoomRealtimeStore((s) => s.presenceReady);
  const hostOnline = useRoomRealtimeStore(selectHostOnline);

  const reconnecting = useDelayedFlag(
    connection === 'reconnecting' || connection === 'connecting',
    SHOW_RECONNECTING_AFTER_MS,
  );
  const hostOffline = useDelayedFlag(
    role === 'player' &&
      connection === 'connected' &&
      presenceReady &&
      !hostOnline,
    SHOW_HOST_OFFLINE_AFTER_MS,
  );

  if (reconnecting) {
    return (
      <div className="connection-status connection-status--reconnecting">
        <p className="connection-status__text">{t('connection.reconnecting')}</p>
      </div>
    );
  }

  if (hostOffline) {
    return (
      <div className="connection-status connection-status--disconnected">
        <p className="connection-status__text">{t('connection.hostOffline')}</p>
      </div>
    );
  }

  return null;
}
