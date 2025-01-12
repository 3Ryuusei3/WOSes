import { useState, useEffect } from 'react';

import useGameStore from '../store/useGameStore';

import ShuffledWordObjectType from '../types/ShuffledWordObject';

import { LETTERS, FAKE_LETTER_LEVEL_START, HIDDEN_LETTER_LEVEL_START } from '../constant';

const createLetterObject = (word: string, level: number, fakeLetter: string, hiddenLetter: string) => {
  let letterObject = word.split('').map(letter => ({
    letter,
    isFake: false,
    isHidden: false
  }));

  if (level >= FAKE_LETTER_LEVEL_START) {
    const randomIndex = Math.floor(Math.random() * (letterObject.length + 1));
    letterObject.splice(randomIndex, 0, { letter: fakeLetter, isFake: true, isHidden: false });
  }

  if (level >= HIDDEN_LETTER_LEVEL_START) {
    const randomIndex = Math.floor(Math.random() * letterObject.length);
    letterObject[randomIndex].isHidden = true;
    letterObject[randomIndex].letter = hiddenLetter;
  }

  return letterObject;
};

const useShuffledWord = (word: string, intervalTime: number, shouldShuffle: boolean) => {
  const { level } = useGameStore();

  const [shuffledWordObject, setShuffledWordObject] = useState<ShuffledWordObjectType[]>([]);
  const [initialShuffledWord, setInitialShuffledWord] = useState<string[]>([]);
  const [fakeLetter, setFakeLetter] = useState<string>('');
  const [hiddenLetter, setHiddenLetter] = useState<string>('');

  useEffect(() => {
    if (!shouldShuffle) return;

    if (initialShuffledWord.length === 0) {
      const shuffledArray = word.split('').sort(() => Math.random() - 0.5);
      setInitialShuffledWord(shuffledArray);
    }

    if (fakeLetter === '') {
      const newFakeLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      setFakeLetter(newFakeLetter);
    }

    if (hiddenLetter === '') {
      const newHiddenLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      setHiddenLetter(newHiddenLetter);
    }

    const shuffleAndAddLetter = () => {
      let letterObject = createLetterObject(word, level, fakeLetter, hiddenLetter);
      letterObject = letterObject.sort(() => Math.random() - 0.5);
      setShuffledWordObject(letterObject);
    };

    const interval = setInterval(shuffleAndAddLetter, intervalTime);
    return () => clearInterval(interval);
  }, [word, intervalTime, shouldShuffle, level, fakeLetter, hiddenLetter, initialShuffledWord]);

  return shuffledWordObject;
};

export default useShuffledWord;
