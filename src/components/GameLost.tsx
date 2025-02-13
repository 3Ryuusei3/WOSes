import { useEffect } from 'react';

import GameLogo from '../atoms/GameLogo';
import Highscores from '../atoms/Highscores';

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

  useEffect(() => {
    if (totalPoints > highestScore.score) {
      setHighestScore({
        name: playerName,
        score: totalPoints
      });
    }

    const audio = new Audio(gameOverSound);
    audio.play();

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [totalPoints, highestScore, setHighestScore]);

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
        <h1 className='lost'>HAS PERDIDO...</h1>
        <h3>HAS ALCANZADO EL NIVEL <span className='highlight'>{level}</span></h3>
        <div className="h-section gap-md mx-auto">
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
            <p>ÚLTIMAS PALABRAS</p>
            <div className="v-section score__container--wordlist" style={{ '--wordlist-rows': Math.ceil(lastLevelWords.length / 3) } as React.CSSProperties}>
              {lastLevelWords.map((word, index) => (
                <h4 className={`${word.guessed ? 'highlight' : 'unguessed'}`} key={`${index}-${word}`}>{word.word.toUpperCase()}</h4>
              ))}
            </div>
          </div>
          <div className="score__container--box">
            <p>TOP 5</p>
            <Highscores />
          </div>
        </div>
        <button onClick={() => {
          setMode('start');
          setTotalPoints(0);
          setLevel(1);
        } }>JUGAR DE NUEVO</button>
      </div>
    </>
  )
}
