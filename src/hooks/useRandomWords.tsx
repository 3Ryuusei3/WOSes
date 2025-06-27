import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import useGameStore from '../store/useGameStore';
import useLanguageWords from './useLanguageWords';

import Difficulty from '../types/Difficulty';

import { getLanguageConstants } from '../constant';

const getRandomWord = (words: string[]) => {
  return words[Math.floor(Math.random() * words.length)];
};

const countLetters = (word: string) => {
  return word.split('').reduce((acc, letter) => {
    acc[letter] = (acc[letter] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
};

const canFormWord = (wordCount: { [key: string]: number }, lettersCount: { [key: string]: number }) => {
  for (const letter in wordCount) {
    if (!lettersCount[letter] || lettersCount[letter] < wordCount[letter]) {
      return false;
    }
  }
  return true;
};

const hasLetterCombination = (word: string, combinations: string[]): boolean => {
  return combinations.some(combo => word.includes(combo));
};

const hasAnyLetter = (word: string, letters: string[]): boolean => {
  return letters.some(letter => word.includes(letter));
};

const useRandomWords = (difficulty: Difficulty = 'hard') => {
  const { i18n } = useTranslation();
  const { setRandomWord, setPossibleWords, level, setHiddenLetterIndex } = useGameStore();
  const { words } = useLanguageWords(difficulty);

  useEffect(() => {
    if (words && words.length > 0) {
      const { WORD_LEVEL_RANGES } = getLanguageConstants(i18n.language);
      const filteredWords = words.filter(word => word.length >= 4 && word.length <= 9);

      const getWordBasedOnLevel = (words: string[]): string => {
        if (level >= WORD_LEVEL_RANGES.START.MIN && level <= WORD_LEVEL_RANGES.START.MAX) {
          const validWords = words.filter(word =>
            hasLetterCombination(word.toUpperCase(), WORD_LEVEL_RANGES.START.LETTERS)
          );
          return validWords.length > 0 ? getRandomWord(validWords) : getRandomWord(words);
        } else if (level >= WORD_LEVEL_RANGES.MID.MIN && level <= WORD_LEVEL_RANGES.MID.MAX) {
          const validWords = words.filter(word =>
            hasAnyLetter(word.toUpperCase(), WORD_LEVEL_RANGES.MID.LETTERS)
          );
          return validWords.length > 0 ? getRandomWord(validWords) : getRandomWord(words);
        } else {
          return getRandomWord(words);
        }
      };

      let word = getWordBasedOnLevel(filteredWords);
      let wordCount = countLetters(word);
      let possibleWordsList = filteredWords.filter(w => canFormWord(countLetters(w), wordCount));

      const maxAttempts = 100;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (possibleWordsList.length >= 12 && possibleWordsList.length <= 22) {
          break;
        }
        word = getWordBasedOnLevel(filteredWords);
        wordCount = countLetters(word);
        possibleWordsList = filteredWords.filter(w => canFormWord(countLetters(w), wordCount));
      }

      possibleWordsList.sort((a, b) => a.length - b.length || a.localeCompare(b));

      setRandomWord(word);
      setPossibleWords(possibleWordsList);
      setHiddenLetterIndex(Math.floor(Math.random() * word.length));
    }
  }, [words, level, setRandomWord, setPossibleWords, setHiddenLetterIndex, difficulty, i18n.language]);
};

export default useRandomWords;
