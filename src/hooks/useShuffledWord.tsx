import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import useGameStore from '../store/useGameStore';

import { getMostCommonLetter } from '../utils';

import { getLanguageConstants, LEVELS_TO_ADVANCE } from '../constant';

import ShuffledWordObjectType from '../types/ShuffledWordObject';
import Mechanics from '../types/Mechanics';
import Word from '../types/Word';

import shuffleSound from '../assets/shuffle.mp3';

const createLetterObject = (word: string, gameMechanics: Mechanics, fakeLetter: string, hiddenLetterIndex: number, possibleWords: string[], lastLevelWords: Word[], levelsToAdvance: number, stillLetterIndex: number, fakeLetterIndex: number, finalStillPosition: number, initialDarkIndex: number) => {
  const mostCommonLetter = getMostCommonLetter(possibleWords, lastLevelWords, levelsToAdvance);

  let commonLetterFlags = levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR ? 2 : (levelsToAdvance === LEVELS_TO_ADVANCE.THREE_STAR ? 1 : 0);

  const letterObject = word.split('').map((letter, index) => {
    const shouldBeCommon = commonLetterFlags > 0 &&
                           mostCommonLetter.includes(letter) &&
                           index !== hiddenLetterIndex;

    if (shouldBeCommon) {
      commonLetterFlags--;
    }

    return {
      letter,
      isFake: false,
      isHidden: index === hiddenLetterIndex,
      isDark: gameMechanics.dark && index === initialDarkIndex,
      isCommon: shouldBeCommon,
      isStill: gameMechanics.still && index === stillLetterIndex
    };
  });

  if (gameMechanics.fake) {
    const insertIndex = fakeLetterIndex;

    letterObject.splice(insertIndex, 0, {
      letter: fakeLetter,
      isFake: true,
      isHidden: false,
      isDark: gameMechanics.dark && insertIndex === initialDarkIndex,
      isCommon: false,
      isStill: gameMechanics.still && insertIndex === stillLetterIndex
    });
  }

  const shuffledLetters = [...letterObject];

  if (gameMechanics.still && finalStillPosition >= 0) {
    const stillLetterObj = shuffledLetters.find(letter => letter.isStill);

    if (stillLetterObj) {
      const stillLetterCurrentIndex = shuffledLetters.findIndex(letter => letter.isStill);
      shuffledLetters.splice(stillLetterCurrentIndex, 1);

      for (let i = shuffledLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledLetters[i], shuffledLetters[j]] = [shuffledLetters[j], shuffledLetters[i]];
      }

      shuffledLetters.splice(finalStillPosition, 0, stillLetterObj);
    }
  } else if (!gameMechanics.still) {
    for (let i = shuffledLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledLetters[i], shuffledLetters[j]] = [shuffledLetters[j], shuffledLetters[i]];
    }
  }

  if (gameMechanics.dark) {
    shuffledLetters.forEach(letter => letter.isDark = false);

    const stillLetter = shuffledLetters.find(letter => letter.isStill);
    const wasStillLetterOriginallyDark = gameMechanics.still && stillLetterIndex === initialDarkIndex;

    if (wasStillLetterOriginallyDark && stillLetter) {
      stillLetter.isDark = true;
    } else {
      let availableIndices = shuffledLetters.map((_, index) => index);
      if (gameMechanics.still && finalStillPosition >= 0) {
        availableIndices = availableIndices.filter(index => index !== finalStillPosition);
      }

      if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        shuffledLetters[randomIndex].isDark = true;
      }
    }
  }

  return shuffledLetters;
};

const useShuffledWord = (word: string, gameMechanics: Mechanics, intervalTime: number, shouldShuffle: boolean, possibleWords: string[], lastLevelWords: Word[], levelsToAdvance: number, volume: number) => {
  const { i18n } = useTranslation();
  const { LETTERS } = getLanguageConstants(i18n.language);
  const { level, hiddenLetterIndex } = useGameStore();

  const [shuffledWordObject, setShuffledWordObject] = useState<ShuffledWordObjectType[]>([]);
  const [initialShuffledWord, setInitialShuffledWord] = useState<string[]>([]);
  const [fakeLetter, setFakeLetter] = useState<string>('');
  const [initialDarkIndex, setInitialDarkIndex] = useState<number>(0);
  const [stillLetterIndex, setStillLetterIndex] = useState<number>(-1);
  const [fakeLetterIndex, setFakeLetterIndex] = useState<number>(-1);
  const [finalStillPosition, setFinalStillPosition] = useState<number>(-1);
  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

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

    if (gameMechanics.still && stillLetterIndex === -1) {
      setStillLetterIndex(Math.floor(Math.random() * word.length));
    }

    if (gameMechanics.fake && fakeLetterIndex === -1) {
      setFakeLetterIndex(Math.floor(Math.random() * word.length));
    }

    if (gameMechanics.dark && initialDarkIndex === 0) {
      const totalLength = word.length + (gameMechanics.fake ? 1 : 0);
      setInitialDarkIndex(Math.floor(Math.random() * totalLength));
    }

    if (gameMechanics.still && finalStillPosition === -1) {
      let position;
      if (gameMechanics.fake) {
        const totalLetters = word.length + 1;
        position = Math.floor(Math.random() * totalLetters);
      } else {
        position = Math.floor(Math.random() * word.length);
      }
      setFinalStillPosition(position);
    }

    const initialLetterObject = createLetterObject(word, gameMechanics, fakeLetter, hiddenLetterIndex, possibleWords, lastLevelWords, levelsToAdvance, stillLetterIndex, fakeLetterIndex, finalStillPosition, initialDarkIndex);
    setShuffledWordObject(initialLetterObject);

    if (!shouldShuffle) return;

    const shuffleAndAddLetter = () => {
      const letterObject = createLetterObject(word, gameMechanics, fakeLetter, hiddenLetterIndex, possibleWords, lastLevelWords, levelsToAdvance, stillLetterIndex, fakeLetterIndex, finalStillPosition, initialDarkIndex);
      setShuffledWordObject(letterObject);

      const audio = new Audio(shuffleSound);
      audio.volume = volumeRef.current;
      audio.play();
    };

    const interval = setInterval(shuffleAndAddLetter, intervalTime);
    return () => clearInterval(interval);
  }, [word, intervalTime, shouldShuffle, initialShuffledWord, fakeLetter, level, hiddenLetterIndex, initialDarkIndex, gameMechanics, lastLevelWords, levelsToAdvance, possibleWords, stillLetterIndex, fakeLetterIndex, finalStillPosition, LETTERS]);

  return shuffledWordObject;
};

export default useShuffledWord;
