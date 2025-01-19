import GameScreen from './GameScreen';
import GameStart from './GameStart';
import GameLost from './GameLost';
import GameLobby from './GameLobby';
import GameLoading from './GameLoading';

import useZoom from '../hooks/useZoom';
import useGameStore from '../store/useGameStore';

const GamePage = () => {
  const { mode, player } = useGameStore();
  const zoom = useZoom();

  return (
    <main style={{ zoom: player && player.role === 'screen' ? zoom : 1 }}>
      <div className="container">
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
