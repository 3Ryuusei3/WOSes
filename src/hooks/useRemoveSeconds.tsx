import { useEffect, useState } from 'react';
import useGameStore from '../store/useGameStore';

const useRemoveSeconds = () => {
  const {
    gameTime,
    setGameTime,
    lastLevelWords,
    levelsToAdvance,
    setNumberOfPerfectRounds,
    setNumberOfRounds,
    gameDifficulty,
  } = useGameStore();
  const [secondsRemoved, setSecondsRemoved] = useState(0);

  const getRandomSeconds = () => {
    const rand = Math.random();

    switch (levelsToAdvance) {
      case 1:
        if (rand < 0.30) return 0;
        if (rand < 0.60) return 1;
        if (rand < 0.90) return 2;
        return 3;
      case 2:
        if (rand < 0.45) return 0;
        if (rand < 0.70) return 1;
        if (rand < 0.95) return 2;
        return 3;
      case 3:
        if (rand < 0.70) return 0;
        if (rand < 0.90) return 1;
        return 2;
      default:
        if (rand < 0.60) return 0;
        if (rand < 0.85) return 1;
        if (rand < 0.95) return 2;
        return 3;
    }
  };

  const isPerfect = lastLevelWords.every((word) => word.guessed);

  useEffect(() => {
    setNumberOfRounds((prev) => prev + 1);

    if (gameDifficulty === "daily") {
       return;
    }

    if (isPerfect) {
      setGameTime((prev) => prev + 1);
      setNumberOfPerfectRounds((prev) => prev + 1);
      setSecondsRemoved(0);
      return;
    }

    const secondsToRemove = getRandomSeconds();
    if (gameTime - secondsToRemove > 5) {
      setGameTime((prev) => prev - secondsToRemove);
      setSecondsRemoved(secondsToRemove);
    }
    return () => {};
  }, []);

  return secondsRemoved;
};

export default useRemoveSeconds;
