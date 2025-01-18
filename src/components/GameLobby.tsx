import { useEffect } from 'react';

import GameLogo from '../atoms/GameLogo';

import useRemoveSeconds from '../hooks/useRemoveSeconds';
import useRandomWords from '../hooks/useRandomWords';

import useGameStore from '../store/useGameStore';

import levelPassedSound from '../assets/win.mp3';

export default function GameLobby() {
  const {
    setMode,
    totalPoints,
    level,
    lastRoundPoints,
    levelsToAdvance,
    lastLevelWords
  } = useGameStore();
  useRandomWords();
  const secondsToRemove = useRemoveSeconds();

  useEffect(() => {
    const audio = new Audio(levelPassedSound);
    audio.play();

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const allWordsGuessed = lastLevelWords.every(word => word.guessed);

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
        <h1 className='highlight'>{allWordsGuessed ? '¡PERFECTO!' : '¡ENHORABUENA!'}</h1>
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
        {secondsToRemove > 0 && (
          <h3>DISPONDRÁS DE <span className="lost">{secondsToRemove}s</span> MENOS EN EL SIGUIENTE NIVEL</h3>
        )}
        <button onClick={() => {
          setMode('loading');
        } }>JUGAR AL NIVEL {level}</button>
      </div>
    </>
  )
}
