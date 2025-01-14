import { useEffect } from 'react';
import useGameStore from '../store/useGameStore';

const useRemoveSeconds = () => {
  const { gameTime, setGameTime } = useGameStore();
  const secondsToRemove = Math.floor(Math.random() * 3);

  useEffect(() => {
    if (gameTime - secondsToRemove > 5) {
      setGameTime(prev => prev - secondsToRemove);
    }
  }, [])

  return secondsToRemove;
};

export default useRemoveSeconds;
