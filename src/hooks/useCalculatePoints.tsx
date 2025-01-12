import { THRESHHOLD } from '../contant';

import points from '../points.json'

const useCalculatePoints = (possibleWords: string[], correctWords: string[]) => {
  const correctWordsPoints = () => {
    return correctWords.reduce((acc: number, word: string) => {
      return acc + word.split('').reduce((acc, letter) => acc + points[letter as keyof typeof points], 0);
    }, 0);
  };

  const possibleWordsPoints = () => {
    return possibleWords.reduce((acc: number, word: string) => {
      return acc + word.split('').reduce((acc, letter) => acc + points[letter as keyof typeof points], 0);
    }, 0);
  };

  const goalPoints = Math.ceil(possibleWordsPoints() * THRESHHOLD.ONE_STAR / 100);
  const totalPoints = possibleWordsPoints();

  return { correctWordsPoints, possibleWordsPoints, goalPoints, totalPoints };
}

export default useCalculatePoints;
