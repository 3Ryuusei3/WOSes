import { useEffect } from 'react';

import GameLogo from '../atoms/GameLogo';

import countdownMusic from '../assets/countdown.mp3';
import useCountdown from '../hooks/useCountdown';

import useGameStore from '../store/useGameStore';

export default function GameLoading() {
  const countdown = useCountdown();
  const { player } = useGameStore();

  useEffect(() => {
    const audio = new Audio(countdownMusic);
    audio.volume = 0.5;

    const playAudio = setTimeout(() => {
      audio.play();
    }, 100);

    return () => {
      clearTimeout(playAudio);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [countdownMusic]);

  return (
    <>
      {(player && player.role === 'screen') ? (
        <>
          <GameLogo />
          <div className='game__container'>
            <h1 className='highlight'>EL JUEGO COMIENZA EN...</h1>
            <div className="loading__container">
              <h2 className='highlight'>
                {Math.floor(countdown) === 0 ? '¡YA!' : Math.floor(countdown)}
              </h2>
              <div className="loading__container--box loading__container--box-xl"></div>
              <div className="loading__container--box loading__container--box-lg"></div>
              <div className="loading__container--box loading__container--box-md"></div>
              <div className="loading__container--box"></div>
            </div>
          </div>
        </>
      ) : (
        <div className="loading__container">
          <h2 className='highlight'>
            {Math.floor(countdown) === 0 ? '¡YA!' : Math.floor(countdown)}
          </h2>
          <div className="loading__container--box loading__container--box-xl"></div>
          <div className="loading__container--box loading__container--box-lg"></div>
          <div className="loading__container--box loading__container--box-md"></div>
          <div className="loading__container--box"></div>
        </div>
      )}
    </>
  )
}
