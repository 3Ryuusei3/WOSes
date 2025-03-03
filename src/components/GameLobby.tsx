import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import GameLogo from '../atoms/GameLogo';
import Tooltip from '../atoms/Tooltip';

import useRemoveSeconds from '../hooks/useRemoveSeconds';
import useRandomWords from '../hooks/useRandomWords';
import useSetDifficulty from '../hooks/useSetDifficulty';

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
    gameTime,
    gameDifficulty
  } = useGameStore();

  const [canAdvance, setCanAdvance] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    new Audio(levelPassedSound).play();
    const timer = setTimeout(() => {
      setCanAdvance(true);
      containerRef.current?.focus();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useSetDifficulty(gameDifficulty, level);
  useRandomWords();
  const secondsToRemove = useRemoveSeconds();

  const handleAdvance = useCallback(() => {
    if (canAdvance) {
      setMode('loading');
    }
  }, [canAdvance, setMode]);

  const allWordsGuessed = lastLevelWords.every(word => word.guessed);

  return (
    <>
      <GameLogo />
      <div
        ref={containerRef}
        className='game__container f-jc-c'
        onKeyDown={(e) => e.key === 'Enter' && handleAdvance()}
        tabIndex={0}
        role="button"
        aria-label="Avanzar al siguiente nivel"
      >
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
          <div className='score__container--box f-jc-c'>
            <div className="v-section gap-md">
              <div className="h-section gap-lg f-jc-sb f-ai-c ">
                <p>PUNTOS DEL NIVEL {level - levelsToAdvance}</p>
                <h3>{lastRoundPoints}</h3>
              </div>
              <div className="h-section gap-lg f-jc-sb f-ai-c ">
                <p>TUS PUNTOS TOTALES</p>
                <h3>{totalPoints}</h3>
              </div>
              <div className="h-section gap-lg f-jc-sb f-ai-c ">
                <p>TIEMPO RESTANTE</p>
                <h3><span className={`${allWordsGuessed ? 'won' : secondsToRemove > 0 ? 'lost' : 'highlight'}`}>{gameTime}s</span></h3>
              </div>
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
