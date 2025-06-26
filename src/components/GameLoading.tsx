import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import useCountdown from '../hooks/useCountdown';
import useGameStore from '../store/useGameStore';

import countdownMusic from '../assets/countdown.mp3';

export default function GameLoading() {
  const { t } = useTranslation();
  const countdown = useCountdown();
  const { volume } = useGameStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(countdownMusic);
      audioRef.current.volume = volume;

      timeoutRef.current = setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <div className='game__container'>
      <h1 className='highlight'>{t('game.gameStartsIn')}</h1>
      <div className="loading__container">
        <h2 className='highlight'>
          {Math.floor(countdown) === 0 ? t('game.start') : Math.floor(countdown)}
        </h2>
        <div className="loading__container--box loading__container--box-xl"></div>
        <div className="loading__container--box loading__container--box-lg"></div>
        <div className="loading__container--box loading__container--box-md"></div>
        <div className="loading__container--box"></div>
      </div>
    </div>
  )
}
