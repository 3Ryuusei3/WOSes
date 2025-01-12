import { useEffect } from 'react';

import GameLogo from '../atoms/GameLogo';

import useGameStore from '../store/useGameStore';

export default function GameLobby() {
  const {
    setMode,
    totalPoints,
    level,
    lastRoundPoints,
    levelsToAdvance,
    gameTime,
    setGameTime,
    lastLevelWords
  } = useGameStore();
  const secondsToRemove = Math.floor(Math.random() * 2) + 1;

  useEffect(() => {
    if (gameTime - secondsToRemove > 5) {
      setGameTime(prev => prev - secondsToRemove);
    }
  }, [setGameTime, secondsToRemove]);

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
        <h1 className='highlight'>¡ENHORABUENA!</h1>
        <h3>HAS AVANZADO <span className='highlight'>{levelsToAdvance}</span> NIVEL{levelsToAdvance > 1 ? 'ES': ''}</h3>
        <div className="v-section gap-md mx-auto">
          <div className="h-section gap-md">
            <div className='score__container--box'>
              <p>PUNTOS DEL NIVEL {level - levelsToAdvance}</p>
              <h3>{lastRoundPoints}</h3>
            </div>
            <div className='score__container--box'>
              <p>TUS PUNTOS TOTALES</p>
              <h3>{totalPoints}</h3>
            </div>
          </div>
          <div className="h-section score__container--box">
            <p>ÚLTIMAS PALABRAS</p>
            <div className="h-section score__container--wordlist" style={{ '--wordlist-rows': Math.ceil(lastLevelWords.length / 3) } as React.CSSProperties}>
              {lastLevelWords.map((word, index) => (
                <h4 className={`${word.guessed ? 'highlight' : 'unguessed'}`} key={`${index}-${word}`}>{word.word.toUpperCase()}</h4>
              ))}
            </div>
          </div>
        </div>
        {gameTime - secondsToRemove > 5 && (
          <h3>DISPONDRÁS DE <span className="lost">{secondsToRemove}s</span> MENOS EN EL SIGUIENTE NIVEL</h3>
        )}
        <button onClick={() => {
          setMode('loading');
        } }>JUGAR AL NIVEL {level}</button>
      </div>
    </>
  )
}
