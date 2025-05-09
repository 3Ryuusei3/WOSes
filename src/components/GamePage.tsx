import GameScreen from './GameScreen';
import GameStart from './GameStart';
import GameLost from './GameLost';
import GameLobby from './GameLobby';
import GameLoading from './GameLoading';

import GameLogo from '../atoms/GameLogo';

import useZoom from '../hooks/useZoom';

import useGameStore from '../store/useGameStore';

const GamePage = () => {
  const { mode } = useGameStore();
  const zoom = useZoom();

  return (
    <main style={{ zoom }}>
      <GameLogo />
      <div className="container pos-rel">
        {mode === 'start' ? (
          <GameStart />
        ) : mode === 'game' ? (
          <GameScreen />
        ) : mode === 'lost' ? (
          <GameLost />
        ) : mode === 'loading' ? (
          <GameLoading />
        ) : (
          <GameLobby />
        )}
      </div>
    </main>
  );
};

export default GamePage;
