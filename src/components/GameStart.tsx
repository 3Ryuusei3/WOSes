import { useState } from 'react';

import GameLogo from '../atoms/GameLogo';
import TopScores from '../atoms/TopScores';

import useRandomWords from '../hooks/useRandomWords';
import useBackgroundAudio from '../hooks/useBackgroundAudio';
import useSetDifficulty from '../hooks/useSetDifficulty';

import useGameStore from '../store/useGameStore';

export default function GameStart() {
  const { playerName, setPlayerName, setMode, gameDifficulty, level } = useGameStore();
  const [error, setError] = useState(false);
  useSetDifficulty(gameDifficulty, level);
  useRandomWords();

  useBackgroundAudio(0.5);

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
          <div className='v-section gap-md w100 f-jc-c'>
            <h2 className='highlight'>INTRODUCE TU NOMBRE<br/>PARA JUGAR</h2>
            <div className="v-section gap-xs">
              <input
                className='mx-auto'
                type='text'
                placeholder='NOMBRE'
                value={playerName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
              <small className={`txt-center ${error ? '' : 'op-0'}`}>
                EL NOMBRE DEBE TENER ENTRE 3 Y 10 CARACTERES
              </small>
            </div>
            <button onClick={handleSubmit}>EMPEZAR PARTIDA</button>
          </div>
          <div className="ranking v-section gap-md top-scores">
            <div className="score__container--box dark">
              <TopScores />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
