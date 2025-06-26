import { useTranslation } from 'react-i18next';
import { THRESHHOLD, getLanguageConstants } from '../constant';

const useCalculatePoints = (possibleWords: string[], correctWords: string[]) => {
  const { i18n } = useTranslation();
  const { POINTS_PER_LETTER } = getLanguageConstants(i18n.language);

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
  const levelPoints = possibleWordsPoints();

  return { correctWordsPoints, possibleWordsPoints, goalPoints, levelPoints };
}

export default useCalculatePoints;
