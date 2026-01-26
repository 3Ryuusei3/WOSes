import GameScreen from './GameScreen';
import GameStart from './GameStart';
import GameLost from './GameLost';
import GameLobby from './GameLobby';
import GameLoading from './GameLoading';
import GameRoom from './GameRoom';
import ConnectionStatus from '../atoms/ConnectionStatus';
import { ToastContainer } from '../atoms/Toast';

import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

import GameLogo from '../atoms/GameLogo';

import useZoom from '../hooks/useZoom';

import useGameStore from '../store/useGameStore';

const GamePage = () => {
  const { mode, setRoomCode, setMode, role, players } = useGameStore();
  const zoom = useZoom();
  const [searchParams] = useSearchParams();

  const roomId = searchParams.get('id');
  useEffect(() => {
    if (roomId && mode === 'start') {
      setRoomCode(roomId);
      setMode('room');
    }
  }, [roomId, mode, setRoomCode, setMode]);

  const hasRoomIdInUrl = !!roomId;
  const effectiveZoom = role === 'player' ? 1 : (role === null && hasRoomIdInUrl ? 1 : zoom);

  const isZoomed = effectiveZoom !== 1;

  return (
    <main style={{ zoom: effectiveZoom }} className={isZoomed ? 'is-zoomed' : ''}>
      {players === 'multi' && <ConnectionStatus />}
      <ToastContainer />
      <GameLogo isZoomed={isZoomed} />
      <div className="container pos-rel">
        {mode === 'start' ? (
          <GameStart />
        ) : mode === 'game' ? (
          <GameScreen />
        ) : mode === 'lost' ? (
          <GameLost />
        ) : mode === 'loading' ? (
          <GameLoading />
        ) : mode === 'room' ? (
          <GameRoom />
        ) : (
          <GameLobby />
        )}
      </div>
    </main>
  );
};

export default GamePage;
