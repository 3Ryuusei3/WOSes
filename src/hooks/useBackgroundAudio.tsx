import { useEffect, useRef } from 'react';

import backgroundMusic from '../assets/background.mp3';
import { isSoundOn } from '../utils/sound';

/**
 * Background music of the start screen. Browsers only let it start after a
 * tap/click, so it waits for the first one. Turning the sound off pauses it
 * right away (iOS ignores the volume, so it has to stop, not go quiet);
 * turning it on again resumes it.
 */
const useBackgroundAudio = (volume: number = 0.5) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // A tap/click already happened (the browser allows playing)
  const unlockedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(backgroundMusic);
    audio.loop = true;
    audioRef.current = audio;

    const unlock = () => {
      unlockedRef.current = true;
      document.removeEventListener('click', unlock);
      setTimeout(() => {
        if (isSoundOn()) audio.play().catch(() => {});
      });
    };
    document.addEventListener('click', unlock);

    return () => {
      document.removeEventListener('click', unlock);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (volume <= 0) {
      audio.pause();
    } else if (unlockedRef.current && audio.paused) {
      audio.play().catch(() => {});
    }
  }, [volume]);
};

export default useBackgroundAudio;
