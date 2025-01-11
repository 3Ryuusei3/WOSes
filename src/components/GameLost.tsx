import { useEffect } from 'react';

import GameLogo from '../atoms/GameLogo';
interface GameLostProps {
  setMode: React.Dispatch<React.SetStateAction<"start" | "lobby" | "game" | "lost" | "loading">>;
  totalPoints: number;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  playerName: string;
  highestScore: {
    name: string;
    score: number;
  }
  setHighestScore: React.Dispatch<React.SetStateAction<{ name: string; score: number }>>;
}

export default function GameLost({ setMode, totalPoints, setTotalPoints, level, setLevel, playerName, highestScore, setHighestScore }: GameLostProps) {

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
