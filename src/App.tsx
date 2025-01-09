import GameScreen from './components/GameScreen';
import GameStart from './components/GameStart';
import GameLost from './components/GameLost';

import useZoom from './hooks/useZoom';
import useGameVariables from './hooks/useGameVariables';

import './App.css';
import GameLobby from './components/GameLobby';

function App() {
  const zoom = useZoom();
  const { mode, setMode, playerName, setPlayerName, totalPoints, setTotalPoints, lastRoundPoints, setLastRoundPoints } = useGameVariables();

  console.log(totalPoints)

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
        />
      ) : mode === 'lost' ? (
        <GameLost
          setMode={setMode}
          totalPoints={totalPoints}
          setTotalPoints={setTotalPoints}
        />
      ) : (
        <GameLobby
          setMode={setMode}
          totalPoints={totalPoints}
          lastRoundPoints={lastRoundPoints}
        />
      )}

    </main>
  );
}

export default App;
