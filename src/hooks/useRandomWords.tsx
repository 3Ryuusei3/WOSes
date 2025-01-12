import { useState, useEffect } from 'react';

import wordsData from '../data/words.json';

import useGameStore from '../store/useGameStore';

const normalize = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Ñ/g, 'Ñ');
};

const getRandomWord = (words: string[]) => {
  return words[Math.floor(Math.random() * words.length)];
};

const canFormWord = (word: string, letters: string) => {
  const normalizedWord = normalize(word);
  const normalizedLetters = normalize(letters);

  const lettersCount = normalizedLetters.split('').reduce((acc, letter) => {
    acc[letter] = (acc[letter] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  for (const letter of normalizedWord) {
    if (!lettersCount[letter]) {
      return false;
    }
    lettersCount[letter]--;
  }
  return true;
};

const useRandomWords = () => {
  const setHiddenLetterIndex = useGameStore(state => state.setHiddenLetterIndex);
  const [randomWord, setRandomWord] = useState<string>('');
  const [possibleWords, setPossibleWords] = useState<string[]>([]);

  useEffect(() => {
    const normalizedWords = Array.from(new Set(wordsData.words.map(normalize)));
    const filteredWords = normalizedWords.filter(word => word.length >= 4 && word.length <= 9);

    let word = getRandomWord(filteredWords);
    let words = filteredWords.filter(w => canFormWord(w, word));

    while (words.length > 22 || words.length < 12) {
      word = getRandomWord(filteredWords);

      words = filteredWords.filter(w => canFormWord(w, word));
    }

    words.sort((a, b) => a.length - b.length || a.localeCompare(b));

    setRandomWord(word);
    setPossibleWords(words);
    setHiddenLetterIndex(Math.floor(Math.random() * word.length));
  }, []);

  return { randomWord, possibleWords };
};

export default useRandomWords;
