import { useEffect } from 'react';

import useGameStore from '../store/useGameStore';

import GameLogo from '../atoms/GameLogo';

export default function GameLost() {
  const {
    setMode,
    totalPoints,
    setTotalPoints,
    level,
    setLevel,
    playerName,
    highestScore,
    setHighestScore
  } = useGameStore();

  useEffect(() => {
    if (totalPoints > highestScore.score) {
      setHighestScore({
        name: playerName,
        score: totalPoints
      });
    }
  }, [totalPoints, highestScore, setHighestScore]);

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
        <h1 className='lost'>HAS PERDIDO...</h1>
        <h3>HAS ALCANZADO EL NIVEL <span className='highlight'>{level}</span></h3>
        <div className="v-section mx-auto gap-md">
          <div className='score__container--box'>
            <p>TUS PUNTOS TOTALES</p>
            <h3>{totalPoints}</h3>
          </div>
          <div className='score__container--box'>
            <p>LA PUNTUACIÓN MÁS ALTA</p>
            <h3>{highestScore.score} - {highestScore.name}</h3>
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
