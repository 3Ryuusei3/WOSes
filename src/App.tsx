import GameScreen from './components/GameScreen';
import GameStart from './components/GameStart';
import GameLost from './components/GameLost';

import useZoom from './hooks/useZoom';

import useGameStore from './store/useGameStore';

import './App.css';
import GameLobby from './components/GameLobby';
import GameLoading from './components/GameLoading';

function App() {
  const { mode } = useGameStore();
  const zoom = useZoom();
  return (
    <main className='container' style={{ zoom }}>
      {mode === 'start' ? (
         <GameStart/>
      ) : mode === 'game' ? (
        <GameScreen />
      ) : mode === 'lost' ? (
        <GameLost />
      ) : mode === 'loading' ? (
        <GameLoading />
      ) : (
        <GameLobby />
      )}

    </main>
  );
}

export default App;
