import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';

import GameLogo from '../atoms/GameLogo';
import Tooltip from '../atoms/Tooltip';

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
    lastLevelWords,
    gameTime
  } = useGameStore();

  const [canAdvance, setCanAdvance] = useState(false);

  useEffect(() => {
    new Audio(levelPassedSound).play();
    const timer = setTimeout(() => setCanAdvance(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useRandomWords();
  const secondsToRemove = useRemoveSeconds();
  console.log(gameTime);

  const handleAdvance = useCallback(() => {
    if (canAdvance) {
      setMode('loading');
    }
  }, [canAdvance, setMode]);

  const allWordsGuessed = lastLevelWords.every(word => word.guessed);

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c' onKeyDown={(e) => e.key === 'Enter' && handleAdvance()}>
        {allWordsGuessed ? (
          <h1 className='won'>¡PERFECTO!</h1>
        ) : (
          <h1 className='highlight'>¡ENHORABUENA!</h1>
        )}
        <h3>
          HAS AVANZADO
          {allWordsGuessed ? (
            <span className='won'> {levelsToAdvance} </span>
          ) : (
            <span className='highlight'> {levelsToAdvance} </span>
          )}
          NIVEL{levelsToAdvance > 1 ? 'ES': ''}
        </h3>
        <div className="h-section gap-lg mx-auto">
          <div className="v-section gap-md">
            <div className='score__container--box'>
              <p>PUNTOS DEL NIVEL {level - levelsToAdvance}</p>
              <h3>{lastRoundPoints}</h3>
            </div>
            <div className='score__container--box'>
              <p>TUS PUNTOS TOTALES</p>
              <h3>{totalPoints}</h3>
            </div>
          </div>
          <div className="v-section score__container--box">
            <Tooltip message="Haz clic en la palabra para ver su significado en el diccionario">
              <div className='info-icon'>𝑖</div>
            </Tooltip>
            <p>ÚLTIMAS PALABRAS</p>
            <div className="v-section score__container--wordlist" style={{ '--wordlist-rows': Math.ceil(lastLevelWords.length / 3) } as React.CSSProperties}>
              {lastLevelWords.map((word, index) => (
                <h4 className={`${word.guessed ? 'highlight' : 'unguessed'}`} key={`${index}-${word}`}>
                  <Link to={`https://dle.rae.es/${word.word}`} target='_blank' rel='noreferrer'>
                    {word.word.toUpperCase()}
                  </Link>
                </h4>
              ))}
            </div>
          </div>
        </div>
        {secondsToRemove > 0 && (
          <h3>DISPONDRÁS DE <span className="lost">{secondsToRemove}s</span> MENOS EN EL SIGUIENTE NIVEL</h3>
        )}
        <button
          onClick={handleAdvance}
          disabled={!canAdvance}
          className={!canAdvance ? 'button-disabled' : ''}
        >
          JUGAR AL NIVEL {level}
        </button>
      </div>
    </>
  )
}
