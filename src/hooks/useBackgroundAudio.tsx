import { useEffect, useRef } from 'react';

import backgroundMusic from '../assets/background.mp3';

const useBackgroundAudio = (volume: number = 0.5) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(backgroundMusic);
      audioRef.current.loop = true;

      const playAudio = () => {
        setTimeout(() => {
          audioRef.current?.play().catch(() => {});
        });
      };

      document.addEventListener('click', playAudio, { once: true });
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
