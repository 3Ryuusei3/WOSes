import Word from "../types/Word";
import Difficulty from "../types/Difficulty";

import { LEVELS_TO_ADVANCE, THRESHHOLD  } from "../constant";

const generateRandomRoom = () =>{
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return '/game?id=' + result;
}

const calculateLevelsToAdvance = (completionPercentage: number): number => {
  if (completionPercentage === THRESHHOLD.FIVE_STAR) return LEVELS_TO_ADVANCE.FIVE_STAR;
  if (completionPercentage >= THRESHHOLD.THREE_STAR) return LEVELS_TO_ADVANCE.THREE_STAR;
  if (completionPercentage >= THRESHHOLD.TWO_STAR) return LEVELS_TO_ADVANCE.TWO_STAR;
  if (completionPercentage >= THRESHHOLD.ONE_STAR) return LEVELS_TO_ADVANCE.ONE_STAR;
  return 0;
};

const calculateProbability = (
  level: number,
  range: {
    START: {
      LEVEL: number;
      PERCENTAGE: number;
    },
    END: {
      LEVEL: number;
      PERCENTAGE: number;
    }
  }
): number => {
  if (level < range.START.LEVEL) return range.START.PERCENTAGE;
  if (level > range.END.LEVEL) return range.END.PERCENTAGE;

  const levelProgress = (level - range.START.LEVEL) / (range.END.LEVEL - range.START.LEVEL);
  const percentageRange = range.END.PERCENTAGE - range.START.PERCENTAGE;
  return Math.floor(range.START.PERCENTAGE + (levelProgress * percentageRange));
};

const getMostCommonLetter = (possibleWords: string[], lastLevelWords: Word[], levelsToAdvance: number) => {
  const doesHighlightCommonLetters = levelsToAdvance >= LEVELS_TO_ADVANCE.THREE_STAR;
  if (!doesHighlightCommonLetters || lastLevelWords.length <= 1) return [];

  const letterFrequency: { [key: string]: number } = {};
  possibleWords.forEach(word => {
    word.split('').forEach(letter => {
      letterFrequency[letter] = (letterFrequency[letter] || 0) + 1;
    });
  });

  const mostCommonLetters = Object.entries(letterFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);

  return mostCommonLetters;
}

const getThisWeekDateRange = () => {
  const now = new Date();
  const currentDay = now.getDay()
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  return {
    formatted: `${formatDate(monday)}-${formatDate(sunday)}`,
    start: monday.toISOString(),
    end: sunday.toISOString()
  };
}

const getDifficultyLabel = (diff: Difficulty) => {
  switch (diff) {
    case 'easy':
      return 'FÁCIL';
    case 'medium':
      return 'MEDIO';
    case 'hard':
      return 'DIFÍCIL';
    default:
      return 'DIFÍCIL';
  }
};

export {
  generateRandomRoom,
  calculateLevelsToAdvance,
  calculateProbability,
  getMostCommonLetter,
  getThisWeekDateRange,
  getDifficultyLabel
};
