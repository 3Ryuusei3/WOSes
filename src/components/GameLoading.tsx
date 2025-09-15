import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import useCountdown from '../hooks/useCountdown';
import { advanceRoomToGame, subscribeToRoom } from '../services/multiplayer';
import useGameStore from '../store/useGameStore';

import countdownMusic from '../assets/countdown.mp3';

export default function GameLoading() {
  const { t } = useTranslation();
  const { volume, role, players, roomCode, roomId, setMode } = useGameStore();
  const countdown = useCountdown();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomChannelRef = useRef<ReturnType<typeof subscribeToRoom> | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(countdownMusic);
      const effectiveVolume = (players === 'multi' && role === 'player') ? 0 : volume;
      audioRef.current.volume = effectiveVolume;

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
    if (roomId) {
      if (!roomChannelRef.current) {
        roomChannelRef.current = subscribeToRoom(roomId, (payload) => {
          const newState = (payload.new as any)?.state;
          if (newState === 'game') {
            setMode('game');
          }
        });
      }
    }
    return () => {
      if (roomChannelRef.current) roomChannelRef.current.unsubscribe();
      roomChannelRef.current = null;
    };
  }, [roomId, setMode]);

  useEffect(() => {
    if (countdown <= 0 && role === 'host' && roomCode) {
      advanceRoomToGame(roomCode);
    }
  }, [countdown, role, roomCode]);

  useEffect(() => {
    if (audioRef.current) {
      const effectiveVolume = (players === 'multi' && role === 'player') ? 0 : volume;
      audioRef.current.volume = effectiveVolume;
    }
  }, [volume, players, role]);

  return (
    <div className='game__container'>
      <h1 className='highlight'>{t('game.gameStartsIn')}</h1>
      <div className="loading__container">
        <h2 className='highlight'>
          {countdown <= 0 ? t('game.start') : Math.ceil(countdown)}
        </h2>
        <div className="loading__container--box loading__container--box-xl"></div>
        <div className="loading__container--box loading__container--box-lg"></div>
        <div className="loading__container--box loading__container--box-md"></div>
        <div className="loading__container--box"></div>
      </div>
    </div>
  )
}
