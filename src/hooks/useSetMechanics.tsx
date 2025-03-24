import { useEffect } from 'react';

import useGameStore from '../store/useGameStore';

import { calculateProbability } from '../utils';

import { LEVEL_RANGES } from '../constant';

import Mechanics from '../types/Mechanics';

type MechanicsType = keyof typeof LEVEL_RANGES;

const calculateMechanicsProbability = (level: number, difficultyType: MechanicsType) => {
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

const useSetMechanics = (gameMechanics: Mechanics, level: number) => {
  const setGameMechanics = useGameStore(state => state.setGameMechanics);

  useEffect(() => {
    const difficulties: MechanicsType[] = ['DARK_LETTER', 'FAKE_LETTER', 'HIDDEN_LETTER', 'FIRST_LETTER'];
    const newMechanics = difficulties.reduce((acc, type) => {
      const probability = calculateMechanicsProbability(level, type);
      const random = Math.floor(Math.random() * 100);
      const key = type.split('_')[0].toLowerCase() as keyof Mechanics;
      return { ...acc, [key]: random < probability };
    }, {} as Mechanics);
    setGameMechanics({ ...gameMechanics, ...newMechanics });
  }, []);
};

export default useSetMechanics;
