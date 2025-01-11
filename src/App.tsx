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
  const {
    mode,
    setMode,
    playerName,
    setPlayerName,
    totalPoints,
    setTotalPoints,
    gameTime,
    setGameTime,
    lastRoundPoints,
    setLastRoundPoints,
    level,
    setLevel,
    levelsToAdvance,
    setLevelsToAdvance,
    highestScore,
    setHighestScore
  } = useGameVariables();

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
          gameTime={gameTime}
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
          setLevel={setLevel}
          playerName={playerName}
          highestScore={highestScore}
          setHighestScore={setHighestScore}
        />
      ) : mode === 'loading' ? (
        <GameLoading
          setMode={setMode}
        />
      ) : (
        <GameLobby
          setMode={setMode}
          gameTime={gameTime}
          setGameTime={setGameTime}
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
