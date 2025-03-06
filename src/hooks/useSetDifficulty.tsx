import { useEffect } from 'react';

import useGameStore from '../store/useGameStore';

import { calculateProbability } from '../utils';

import { LEVEL_RANGES } from '../constant';

import Difficulty from '../types/Difficulty';

type DifficultyType = keyof typeof LEVEL_RANGES;

const calculateDifficultyProbability = (level: number, difficultyType: DifficultyType) => {
  const range = LEVEL_RANGES[difficultyType];
  return calculateProbability(level, {
    START: {
      LEVEL: range.START,
      PERCENTAGE: 0
    },
    END: {
      LEVEL: range.END,
      PERCENTAGE: 100
    }
  });
};

const useSetDifficulty = (gameDifficulty: Difficulty, level: number) => {
  const setGameDifficulty = useGameStore(state => state.setGameDifficulty);

  useEffect(() => {
    const difficulties: DifficultyType[] = ['DARK_LETTER', 'FAKE_LETTER', 'HIDDEN_LETTER', 'FIRST_LETTER'];
    const newDifficulty = difficulties.reduce((acc, type) => {
      const probability = calculateDifficultyProbability(level, type);
      const random = Math.floor(Math.random() * 100);
      const key = type.split('_')[0].toLowerCase() as keyof Difficulty;
      return { ...acc, [key]: random < probability };
    }, {} as Difficulty);
    setGameDifficulty({ ...gameDifficulty, ...newDifficulty });
  }, []);
};

export default useSetDifficulty;
