import { useEffect } from 'react';

import hardWordsData from '../data/words.json';
import mediumWordsData from '../data/words1.json';
import easyWordsData from '../data/words2.json';

import useGameStore from '../store/useGameStore';

import Difficulty from '../types/Difficulty';

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
  const wordsData = difficulty === 'easy' ? easyWordsData : difficulty === 'medium' ? mediumWordsData : hardWordsData;
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
  }, [setRandomWord, setPossibleWords, setHiddenLetterIndex]);

  return null;
};

export default useRandomWords;
