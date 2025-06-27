import { useEffect, useRef } from 'react';

import backgroundMusic from '../assets/background.mp3';

const useBackgroundAudio = (volume: number = 0.5) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playAudioRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(backgroundMusic);
      audioRef.current.loop = true;

      const playAudio = () => {
        setTimeout(() => {
          audioRef.current?.play().catch(() => {});
        });
        document.removeEventListener('click', playAudio);
        playAudioRef.current = null;
      };

      playAudioRef.current = playAudio;
      document.addEventListener('click', playAudio);
    }

    return () => {
      if (playAudioRef.current) {
        document.removeEventListener('click', playAudioRef.current);
        playAudioRef.current = null;
      }

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
