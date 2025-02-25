import { useEffect, useState } from 'react';
import useGameStore from '../store/useGameStore';

const useRemoveSeconds = () => {
  const { gameTime, setGameTime, lastLevelWords } = useGameStore();
  const [secondsRemoved, setSecondsRemoved] = useState(0);

  const getRandomSeconds = () => {
    const rand = Math.random();
    if (rand < 0.60) return 0;
    if (rand < 0.85) return 1;
    if (rand < 0.95) return 2;
    return 3;
  };

  useEffect(() => {
    const isPerfect = lastLevelWords.every(word => word.guessed);
    if (isPerfect) {
      setSecondsRemoved(0);
      return;
    }

    const secondsToRemove = getRandomSeconds();
    if (gameTime - secondsToRemove > 5) {
      setGameTime(prev => prev - secondsToRemove);
      setSecondsRemoved(secondsToRemove);
    }
    return () => {};
  }, []);

  return secondsRemoved;
};

export default useRemoveSeconds;
