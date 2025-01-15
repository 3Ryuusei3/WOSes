import { useEffect } from 'react';
import useGameStore from '../store/useGameStore';

const useRemoveSeconds = () => {
  const { gameTime, setGameTime } = useGameStore();

  const getRandomSeconds = () => {
    const rand = Math.random();
    if (rand < 0.50) return 0;
    if (rand < 0.80) return 1;
    if (rand < 0.95) return 2;
    return 3;
  };

  const secondsToRemove = getRandomSeconds();

  useEffect(() => {
    if (gameTime - secondsToRemove > 5) {
      setGameTime(prev => prev - secondsToRemove);
    }
  }, []);

  return secondsToRemove;
};

export default useRemoveSeconds;
