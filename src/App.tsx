import GameScreen from './components/GameScreen';
import GameStart from './components/GameStart';
import GameLost from './components/GameLost';

import useZoom from './hooks/useZoom';
import useGameVariables from './hooks/useGameVariables';

import './App.css';
import GameLobby from './components/GameLobby';
import GameLoading from './components/GameLoading';

function App() {
  const zoom = useZoom();
  const { mode, setMode, playerName, setPlayerName, totalPoints, setTotalPoints, lastRoundPoints, setLastRoundPoints, level, setLevel, levelsToAdvance, setLevelsToAdvance } = useGameVariables();

  return (
    <main className='container' style={{ zoom }}>
      {mode === 'start' ? (
         <GameStart
          playerName={playerName}
          setPlayerName={setPlayerName}
          setMode={setMode}
         />
      ) : mode === 'game' ? (
        <GameScreen
          playerName={playerName}
          setMode={setMode}
          setTotalPoints={setTotalPoints}
          setLastRoundPoints={setLastRoundPoints}
          level={level}
          setLevel={setLevel}
          setLevelsToAdvance={setLevelsToAdvance}
        />
      ) : mode === 'lost' ? (
        <GameLost
          setMode={setMode}
          totalPoints={totalPoints}
          setTotalPoints={setTotalPoints}
          level={level}
        />
      ) : mode === 'loading' ? (
        <GameLoading
          setMode={setMode}
        />
      ) : (
        <GameLobby
          setMode={setMode}
          totalPoints={totalPoints}
          lastRoundPoints={lastRoundPoints}
          level={level}
          levelsToAdvance={levelsToAdvance}
        />
      )}

    </main>
  );
}

export default App;
