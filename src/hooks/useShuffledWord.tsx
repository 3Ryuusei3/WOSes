import { useState, useEffect } from 'react';

import useGameStore from '../store/useGameStore';

import { getMostCommonLetter } from '../utils';

import { LETTERS } from '../constant';

import ShuffledWordObjectType from '../types/ShuffledWordObject';
import Difficulty from '../types/Difficulty';
import Word from '../types/Word';

import shuffleSound from '../assets/shuffle.mp3';

const createLetterObject = (word: string, gameDifficulty: Difficulty, fakeLetter: string, hiddenLetterIndex: number, darkLetterIndex: number, possibleWords: string[], lastLevelWords: Word[]) => {
  const mostCommonLetter = getMostCommonLetter(possibleWords, lastLevelWords);
  let hasCommonLetter = false;

  const letterObject = word.split('').map((letter, index) => {
    const shouldBeCommon = !hasCommonLetter &&
                          mostCommonLetter.includes(letter) &&
                          index !== hiddenLetterIndex;

    if (shouldBeCommon) {
      hasCommonLetter = true;
    }

    return {
      letter,
      isFake: false,
      isHidden: index === hiddenLetterIndex,
      isDark: gameDifficulty.dark && index === darkLetterIndex,
      isCommon: shouldBeCommon
    };
  });

  if (gameDifficulty.fake) {
    const randomIndex = Math.floor(Math.random() * letterObject.length);
    letterObject.splice(randomIndex, 0, {
      letter: fakeLetter,
      isFake: true,
      isHidden: false,
      isDark: gameDifficulty.dark && letterObject.length === darkLetterIndex,
      isCommon: false
    });
  }

  for (let i = letterObject.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letterObject[i], letterObject[j]] = [letterObject[j], letterObject[i]];
  }

  return letterObject;
};

const useShuffledWord = (word: string, gameDifficulty: Difficulty, intervalTime: number, shouldShuffle: boolean, possibleWords: string[], lastLevelWords: Word[]) => {
  const { level, hiddenLetterIndex } = useGameStore();

  const [shuffledWordObject, setShuffledWordObject] = useState<ShuffledWordObjectType[]>([]);
  const [initialShuffledWord, setInitialShuffledWord] = useState<string[]>([]);
  const [fakeLetter, setFakeLetter] = useState<string>('');
  const [darkLetterIndex, setDarkLetterIndex] = useState<number>(0);

  useEffect(() => {
    if (initialShuffledWord.length === 0) {
      const shuffledArray = word.split('').sort(() => Math.random() - 0.5);
      setInitialShuffledWord(shuffledArray);
    }

    if (fakeLetter === '') {
      let newFakeLetter;
      do {
        newFakeLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      } while (newFakeLetter === word[hiddenLetterIndex]);
      setFakeLetter(newFakeLetter);
    }

    const initialLetterObject = createLetterObject(word, gameDifficulty, fakeLetter, hiddenLetterIndex, darkLetterIndex, possibleWords, lastLevelWords);
    setShuffledWordObject(initialLetterObject);

    if (!shouldShuffle) return;

    const shuffleAndAddLetter = () => {
      if (gameDifficulty.dark) {
        setDarkLetterIndex(() => {
          const newIndex = Math.floor(Math.random() * (word.length + (gameDifficulty.fake ? 1 : 0)));
          return newIndex;
        });
      }

      let letterObject = createLetterObject(word, gameDifficulty, fakeLetter, hiddenLetterIndex, darkLetterIndex, possibleWords, lastLevelWords);
      letterObject = letterObject.sort(() => Math.random() - 0.5);
      setShuffledWordObject(letterObject);

      const audio = new Audio(shuffleSound);
      audio.play();
    };

    const interval = setInterval(shuffleAndAddLetter, intervalTime);
    return () => clearInterval(interval);
  }, [word, intervalTime, shouldShuffle, initialShuffledWord, fakeLetter, level, hiddenLetterIndex, darkLetterIndex]);

  return shuffledWordObject;
};

export default useShuffledWord;
