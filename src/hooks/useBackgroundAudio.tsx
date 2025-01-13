import { useEffect } from 'react';

import backgroundMusic from '../assets/background.mp3';

const useBackgroundAudio = (volume: number = 0.5, delay: number = 1000) => {
  useEffect(() => {
    const audio = new Audio(backgroundMusic);
    audio.loop = true;
    audio.volume = volume;

    const playAudio = () => {
      setTimeout(() => {
        audio.play().catch(() => {});
      }, delay);
    };

    document.addEventListener('click', playAudio, { once: true });

    return () => {
      document.removeEventListener('click', playAudio);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [volume, delay]);
};

export default useBackgroundAudio;
