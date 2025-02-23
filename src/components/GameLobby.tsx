import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import GameLogo from '../atoms/GameLogo';

import useRemoveSeconds from '../hooks/useRemoveSeconds';
import useRandomWords from '../hooks/useRandomWords';

import useGameStore from '../store/useGameStore';

import levelPassedSound from '../assets/win.mp3';
import Tooltip from './Tooltip';

export default function GameLobby() {
  const {
    setMode,
    totalPoints,
    level,
    lastRoundPoints,
    levelsToAdvance,
    lastLevelWords
  } = useGameStore();
  const [canAdvance, setCanAdvance] = useState(false);
  useRandomWords();
  const secondsToRemove = useRemoveSeconds();

  useEffect(() => {
    const audio = new Audio(levelPassedSound);
    audio.play();

    const timer = setTimeout(() => {
      setCanAdvance(true);
    }, 2000);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && canAdvance) {
        setMode('loading');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setMode, canAdvance]);

  const allWordsGuessed = lastLevelWords.every(word => word.guessed);

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
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
        <div className="h-section gap-md mx-auto">
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
          onClick={() => setMode('loading')}
          disabled={!canAdvance}
          className={!canAdvance ? 'button-disabled' : ''}
        >
          {canAdvance ? `JUGAR AL NIVEL ${level}` : 'CARGANDO...'}
        </button>
      </div>
    </>
  )
}
