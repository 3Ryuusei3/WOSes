import React, { useEffect, useState } from 'react';
import GameLogo from '../atoms/GameLogo';

interface GameLoadingProps {
  setMode: React.Dispatch<React.SetStateAction<"start" | "lobby" | "game" | "lost" | "loading">>;
}

export default function GameLoading({ setMode }: GameLoadingProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setMode('game');
    }
  }, [countdown, setMode]);

  return (
    <>
      <GameLogo />
      <div className='game__container'>
        <h1 className='highlight'>EL JUEGO COMIENZA EN...</h1>
        <div className="loading__container">
          <h2 className='highlight'>{countdown}</h2>
          <div className="loading__container--box loading__container--box-xl"></div>
          <div className="loading__container--box loading__container--box-lg"></div>
          <div className="loading__container--box loading__container--box-md"></div>
          <div className="loading__container--box"></div>
        </div>
      </div>
    </>
  )
}
