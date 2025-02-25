import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import GameLogo from '../atoms/GameLogo';
import TopScores from '../atoms/TopScores';
import Tooltip from '../atoms/Tooltip';

import useGameStore from '../store/useGameStore';

import gameOverSound from '../assets/gameover.mp3';

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
    lastLevelWords
  } = useGameStore();

  const handlePlayAgain = () => {
    setMode('start');
    setTotalPoints(0);
    setLevel(1);
  };

  useEffect(() => {
    const audio = new Audio(gameOverSound);

    audio.addEventListener('canplaythrough', () => {
      audio.play().catch(err => console.log('Audio playback failed:', err));
    }, { once: true });

    if (totalPoints > highestScore.score) {
      setHighestScore({
        name: playerName,
        score: totalPoints
      });
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [totalPoints, highestScore.score, playerName, setHighestScore]);

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
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
          <div className="score__container--box">
            <p>TOP 8</p>
            <TopScores hasTooltip />
          </div>
        </div>
        <button onClick={handlePlayAgain}>JUGAR DE NUEVO</button>
      </div>
    </>
  )
}
