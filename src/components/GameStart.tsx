import { useState } from 'react';

import GameLogo from '../atoms/GameLogo';
import TopScores from '../atoms/TopScores';
import VotingModal from '../atoms/VotingModal';
// import DifficultySelector from '../atoms/DifficultySelector';

import useRandomWords from '../hooks/useRandomWords';
import useBackgroundAudio from '../hooks/useBackgroundAudio';
import useSetMechanics from '../hooks/useSetMechanics';

import useGameStore from '../store/useGameStore';

export default function GameStart() {
  const { playerName, setPlayerName, setMode, gameMechanics, level, /* setGameDifficulty */ gameDifficulty } = useGameStore();
  const [error, setError] = useState(false);
  useSetMechanics(gameMechanics, level);
  useRandomWords(gameDifficulty);

  useBackgroundAudio(0.3);

  const handleSubmit = () => {
    if (playerName.length >= 3 && playerName.length <= 10) {
      setMode('loading');
    } else {
      setError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setError(false);
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setPlayerName(value);
  };

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
        <div className="h-section gap-sm">
          <div className='v-section gap-lg w100 f-jc-c'>
            <h2 className='highlight'>INTRODUCE TU NOMBRE {/* Y ELIGE */}<br/> {/* UNA DIFICULTAD */} PARA JUGAR</h2>
            <div className="v-section gap-xs">
              <small className={`txt-center ${error ? '' : 'op-0'}`}>
                EL NOMBRE DEBE TENER ENTRE 3 Y 10 CARACTERES
              </small>
              <input
                className='mx-auto'
                type='text'
                placeholder='NOMBRE'
                value={playerName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* <DifficultySelector
              gameDifficulty={gameDifficulty}
              onDifficultyChange={setGameDifficulty}
            /> */}

            <div className="h-section gap-xs f-jc-c">
              <button onClick={handleSubmit}>EMPEZAR PARTIDA</button>
            </div>

          </div>
          <div className="ranking v-section gap-md top-scores">
            <div className="score__container--box dark">
              <TopScores />
            </div>
          </div>
        </div>
      </div>
      <VotingModal />
    </>
  );
}
