import { useEffect } from 'react';

import GameLogo from '../atoms/GameLogo';

interface GameLobbyProps {
  setMode: React.Dispatch<React.SetStateAction<"start" | "lobby" | "game" | "lost" | "loading">>;
  gameTime: number;
  setGameTime: React.Dispatch<React.SetStateAction<number>>;
  totalPoints: number;
  lastRoundPoints: number;
  level: number;
  levelsToAdvance: number;
}

export default function GameLobby({ setMode, gameTime, setGameTime, totalPoints, lastRoundPoints, level, levelsToAdvance }: GameLobbyProps) {
  const secondsToRemove = Math.floor(Math.random() * 2) + 1;

  useEffect(() => {
    if (gameTime - secondsToRemove > 5) {
      setGameTime(prev => prev - secondsToRemove);
    }
  }, [setGameTime, secondsToRemove]);

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
        <h1 className='highlight'>¡ENHORABUENA!</h1>
        <h3>HAS AVANZADO <span className='highlight'>{levelsToAdvance}</span> NIVEL{levelsToAdvance > 1 ? 'ES': ''}</h3>
        <div className="v-section mx-auto gap-md">
          <div className='score__container--box'>
            <p>PUNTOS DEL NIVEL {level - levelsToAdvance}</p>
            <h3>{lastRoundPoints}</h3>
          </div>
          <div className='score__container--box'>
            <p>TUS PUNTOS TOTALES</p>
            <h3>{totalPoints}</h3>
          </div>
        </div>
        {gameTime - secondsToRemove > 5 && (
          <h3>DISPONDRÁS DE <span className="lost">{secondsToRemove}s</span> MENOS EN EL SIGUIENTE NIVEL</h3>
        )}
        <button onClick={() => {
          setMode('loading');
        } }>JUGAR AL NIVEL {level}</button>
      </div>
    </>
  )
}
