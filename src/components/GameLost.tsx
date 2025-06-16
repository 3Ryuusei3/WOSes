import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import TopScores from '../atoms/TopScores';
import Tooltip from '../atoms/Tooltip';
import GameSound from '../atoms/GameSound';
import DifficultyTag from '../atoms/DifficultyTag';

import useGameStore from '../store/useGameStore';

import gameOverSound from '../assets/gameover.mp3';
import { START_TIME } from '../constant';

export default function GameLost() {
  const {
    setMode,
    totalPoints,
    setTotalPoints,
    level,
    setLevel,
    playerName,
    highestScore,
    setHighestScore,
    lastLevelWords,
    setGameMechanics,
    setGameTime,
    setLevelsToAdvance,
    setNumberOfPerfectRounds,
    gameDifficulty,
    volume
  } = useGameStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayAgain = () => {
    setMode('start');
    setTotalPoints(0);
    setLevel(1);
    setGameMechanics({ fake: false, hidden: false, first: false, dark: false, still: false });
    setGameTime(START_TIME);
    setNumberOfPerfectRounds(0);
    setLevelsToAdvance(0)
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(gameOverSound);
      audioRef.current.volume = volume;

      audioRef.current.addEventListener('canplaythrough', () => {
        audioRef.current?.play().catch(err => console.error('Audio playback failed:', err));
      }, { once: true });
    }

    if (totalPoints > highestScore.score) {
      setHighestScore({
        name: playerName,
        score: totalPoints
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [totalPoints, highestScore.score, playerName, setHighestScore]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <div className='game__container f-jc-c'>
      <div className="difficulty-tag">
        <DifficultyTag gameDifficulty={gameDifficulty} />
      </div>
      <h1 className='lost'>HAS PERDIDO...</h1>
      <h3>HAS ALCANZADO EL NIVEL <span className='highlight'>{level}</span></h3>
      <div className="h-section gap-lg mx-auto">
        <div className="v-section gap-md">
          <div className='score__container--box'>
            <p>TUS PUNTOS TOTALES</p>
            <h3>{totalPoints}</h3>
          </div>
          <div className='score__container--box'>
            <p>LA PUNTUACIÓN MÁS ALTA</p>
            <h3>{highestScore.score}</h3>
            <h3>{highestScore.name}</h3>
          </div>
        </div>
        <div className="v-section gap-md">
          <div className="v-section score__container--box">
            <Tooltip message="Haz clic en la palabra para ver su significado en el diccionario">
              <div className='info-icon'>i</div>
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
        <div className="score__container--box pos-rel">
          <TopScores hasTooltip difficulty={gameDifficulty} />
        </div>
      </div>
      <div className="h-section gap-xs f-jc-c mb-sm">
        <button onClick={handlePlayAgain}>JUGAR DE NUEVO</button>
      </div>
      <GameSound />
    </div>
  )
}
