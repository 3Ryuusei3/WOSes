import { useEffect, useRef } from 'react';

import backgroundMusic from '../assets/background.mp3';

const useBackgroundAudio = (volume: number = 0.5) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(backgroundMusic);
      audioRef.current.loop = true;

      const playAudio = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target && (target.hasAttribute('data-start-button'))) {
          return;
        }
        setTimeout(() => {
          audioRef.current?.play().catch(() => {});
        });
        document.removeEventListener('click', playAudio);
      };
      document.addEventListener('click', playAudio);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
};

export default useBackgroundAudio;
