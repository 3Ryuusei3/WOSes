import Word from '../types/Word';
import { THRESHHOLD, POINTS_PER_LETTER } from '../constant';

const useCalculatePoints = (possibleWords: Word[]) => {
  const correctWords = possibleWords.filter((word: Word) => word.guessed_by);

  const correctWordsPoints = () => {
    return correctWords.reduce((acc: number, word: Word) => {
      return acc + word.word.split('').reduce((acc, letter) => acc + POINTS_PER_LETTER[letter as keyof typeof POINTS_PER_LETTER], 0);
    }, 0);
  };

  const possibleWordsPoints = () => {
    return possibleWords.reduce((acc: number, word: Word) => {
      return acc + word.word.split('').reduce((acc, letter) => acc + POINTS_PER_LETTER[letter as keyof typeof POINTS_PER_LETTER], 0);
    }, 0);
  };

  const calculatePlayerPoints = (words: Word[]) => {
    return words.reduce((acc: number, word: Word) => {
      return acc + word.word.split('').reduce((acc, letter) => acc + POINTS_PER_LETTER[letter as keyof typeof POINTS_PER_LETTER], 0);
    }, 0);
  };

  const playerPoints = correctWords.reduce((acc: { [key: string]: Word[] }, word) => {
    if (!acc[word.guessed_by]) {
      acc[word.guessed_by] = [];
    }
    acc[word.guessed_by].push(word);
    return acc;
  }, {});

  const ranking = Object.keys(playerPoints).map(player => ({
    player,
    points: calculatePlayerPoints(playerPoints[player])
  })).sort((a, b) => b.points - a.points);

  const goalPoints = Math.ceil(possibleWordsPoints() * THRESHHOLD.ONE_STAR / 100);
  const totalLevelPoints = possibleWordsPoints();

  return { correctWordsPoints, possibleWordsPoints, goalPoints, totalLevelPoints, calculatePlayerPoints, playerPoints, ranking };
}

export default useCalculatePoints;
