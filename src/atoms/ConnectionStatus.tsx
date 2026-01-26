import { useTranslation } from 'react-i18next';
import useRealtimeConnection from '../hooks/useRealtimeConnection';

export default function ConnectionStatus() {
  const { t } = useTranslation();
  const { status, retryCount } = useRealtimeConnection();

  if (status === 'connected') {
    return null; // No mostrar nada si está conectado
  }

  return (
    <div className={`connection-status connection-status--${status}`}>
      {status === 'disconnected' && (
        <p className="connection-status__text">
          ⚠️ {t('connection.disconnected')}
        </p>
      )}
      {status === 'reconnecting' && (
        <p className="connection-status__text">
          🔄 {t('connection.reconnecting')} {retryCount > 0 ? `(${retryCount})` : ''}
        </p>
      )}
      {status === 'error' && (
        <p className="connection-status__text">
          ❌ {t('connection.error')}
        </p>
      )}
    </div>
  );
}
