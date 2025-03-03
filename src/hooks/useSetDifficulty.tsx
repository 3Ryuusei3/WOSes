import { useEffect } from 'react';

import useGameStore from '../store/useGameStore';

import Difficulty from '../types/Difficulty';

import { LEVEL_RANGES } from '../constant';
import { calculateProbability } from '../utils';


const useSetDifficulty = (gameDifficulty: Difficulty, level: number) => {
  const setGameDifficulty = useGameStore(state => state.setGameDifficulty);

  useEffect(() => {
    const fakeLetterProbability = calculateProbability(level, LEVEL_RANGES.FAKE_LETTER.START, LEVEL_RANGES.FAKE_LETTER.END);
    const hiddenLetterProbability = calculateProbability(level, LEVEL_RANGES.HIDDEN_LETTER.START, LEVEL_RANGES.HIDDEN_LETTER.END);
    const hiddenWordsProbability = calculateProbability(level, LEVEL_RANGES.HIDDEN_WORDS.START, LEVEL_RANGES.HIDDEN_WORDS.END);

    const fakeLetterRandom = Math.floor(Math.random() * 100);
    const hiddenLetterRandom = Math.floor(Math.random() * 100);
    const hiddenWordsRandom = Math.floor(Math.random() * 100);

    setGameDifficulty({
      ...gameDifficulty,
      fake: fakeLetterRandom < fakeLetterProbability,
      hidden: hiddenLetterRandom < hiddenLetterProbability,
      hiddenWords: hiddenWordsRandom < hiddenWordsProbability,
    });
  }, []);
};

export default useSetDifficulty;
