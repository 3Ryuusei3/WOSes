import { THRESHHOLD, POINTS_PER_LETTER } from '../constant';

const useCalculatePoints = (possibleWords: string[], correctWords: string[]) => {
  const correctWordsPoints = () => {
    return correctWords.reduce((acc: number, word: string) => {
      return acc + word.split('').reduce((acc, letter) => acc + POINTS_PER_LETTER[letter as keyof typeof POINTS_PER_LETTER], 0);
    }, 0);
  };

  const possibleWordsPoints = () => {
    return possibleWords.reduce((acc: number, word: string) => {
      return acc + word.split('').reduce((acc, letter) => acc + POINTS_PER_LETTER[letter as keyof typeof POINTS_PER_LETTER], 0);
    }, 0);
  };

  const goalPoints = Math.ceil(possibleWordsPoints() * THRESHHOLD.ONE_STAR / 100);
  const totalPoints = possibleWordsPoints();

  return { correctWordsPoints, possibleWordsPoints, goalPoints, totalPoints };
}

export default useCalculatePoints;
