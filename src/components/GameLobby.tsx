import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import GameLogo from '../atoms/GameLogo';
import Tooltip from '../atoms/Tooltip';

import useRemoveSeconds from '../hooks/useRemoveSeconds';
import useRandomWords from '../hooks/useRandomWords';
import useSetMechanics from '../hooks/useSetMechanics';

import useGameStore from '../store/useGameStore';

import levelPassedSound from '../assets/win.mp3';

import { LEVELS_TO_ADVANCE } from '../constant';

export default function GameLobby() {
  const {
    setMode,
    totalPoints,
    level,
    lastRoundPoints,
    levelsToAdvance,
    lastLevelWords,
    gameTime,
    gameMechanics,
    numberOfPerfectRounds
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

  useSetMechanics(gameMechanics, level);
  useRandomWords();
  const secondsToRemove = useRemoveSeconds();

  const handleAdvance = useCallback(() => {
    if (canAdvance) {
      setMode('loading');
    }
  }, [canAdvance, setMode]);

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
        {levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR ? (
          <h1 className='won'>¡PERFECTO!</h1>
        ) : (
          <h1 className='highlight'>¡ENHORABUENA!</h1>
        )}
        <h3>
          HAS AVANZADO
          {levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR? (
            <span className='won'> {levelsToAdvance} </span>
          ) : (
            <span className='highlight'> {levelsToAdvance} </span>
          )}
          NIVEL{levelsToAdvance > 1 ? 'ES': ''}
        </h3>
        <div className="h-section gap-lg mx-auto">
          <div className='score__container--box f-jc-c'>
            <div className="v-section gap-sm">
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
                <h3><span className={`${levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR? 'won' : secondsToRemove > 0 ? 'lost' : 'highlight'}`}>{gameTime}s</span></h3>
              </div>
              <div className="h-section gap-lg f-jc-sb f-ai-c ">
                <p>RONDAS PERFECTAS</p>
                <h3><span className={`${levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR? 'won' : 'highlight'}`}>{numberOfPerfectRounds}</span></h3>
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
        {levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR&& (
          <h3>LAS <span className="tip">2 LETRAS</span>  MÁS USADAS ESTARÁN <span className="tip">RESALTADAS</span> y TENDRÁS <span className="won">1s EXTRA</span></h3>
        )}
        {(levelsToAdvance === LEVELS_TO_ADVANCE.THREE_STAR) && (
          <h3>LA LETRA MÁS USADA ESTARÁ <span className="tip">RESALTADA</span></h3>
        )}
        <div className="h-section gap-xs f-jc-c mb-sm">
          <button
            onClick={handleAdvance}
            disabled={!canAdvance}
            className={!canAdvance ? 'button-disabled' : ''}
          >
            JUGAR AL NIVEL {level}
          </button>
        </div>
      </div>
    </>
  )
}
