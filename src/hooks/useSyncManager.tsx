import { useMemo } from 'react';
import SyncManager from '../domain/multiplayer/SyncManager';

/**
 * Hook para usar el SyncManager
 */
export const useSyncManager = () => {
  const syncManager = useMemo(() => {
    return new SyncManager();
  }, []);
  
  return syncManager;
};

export default useSyncManager;
