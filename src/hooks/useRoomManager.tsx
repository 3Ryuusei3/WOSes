import { useMemo } from 'react';
import RoomManager from '../domain/multiplayer/RoomManager';

/**
 * Hook para usar el RoomManager
 */
export const useRoomManager = () => {
  const roomManager = useMemo(() => {
    return new RoomManager();
  }, []);
  
  return roomManager;
};

export default useRoomManager;
