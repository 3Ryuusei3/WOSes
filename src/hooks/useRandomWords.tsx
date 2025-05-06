import { useEffect } from 'react';

import hardWordsData from '../data/hard.json';
import mediumWordsData from '../data/medium.json';
import easyWordsData from '../data/easy.json';

import useGameStore from '../store/useGameStore';

import Difficulty from '../types/Difficulty';

const DIFFICULTY_WORDS = {
  easy: easyWordsData,
  medium: mediumWordsData,
  hard: hardWordsData
};

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

const useRandomWords = (difficulty: Difficulty = 'hard') => {
  const wordsData = DIFFICULTY_WORDS[difficulty];

  const setHiddenLetterIndex = useGameStore(state => state.setHiddenLetterIndex);
  const setRandomWord = useGameStore(state => state.setRandomWord);
  const setPossibleWords = useGameStore(state => state.setPossibleWords);

  useEffect(() => {
    const filteredWords = wordsData.words.filter(word => word.length >= 4 && word.length <= 9);

    let word = getRandomWord(filteredWords);
    let wordCount = countLetters(word);
    let words = filteredWords.filter(w => canFormWord(countLetters(w), wordCount));

    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (words.length >= 12 && words.length <= 22) {
        break;
      }
      word = getRandomWord(filteredWords);
      wordCount = countLetters(word);
      words = filteredWords.filter(w => canFormWord(countLetters(w), wordCount));
    }

    words.sort((a, b) => a.length - b.length || a.localeCompare(b));

    setRandomWord(word);
    setPossibleWords(words);
    setHiddenLetterIndex(Math.floor(Math.random() * word.length));
  }, [setRandomWord, setPossibleWords, setHiddenLetterIndex, difficulty, wordsData]);

  return null;
};

export default useRandomWords;
