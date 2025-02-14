import { useState, useEffect } from 'react';
import useGameStore from '../store/useGameStore';
import ShuffledWordObjectType from '../types/ShuffledWordObject';
import { LETTERS, FAKE_LETTER_LEVEL_START } from '../constant';
import shuffleSound from '../assets/shuffle.mp3';

const createLetterObject = (word: string, level: number, fakeLetter: string, hiddenLetterIndex: number) => {
  let letterObject = word.split('').map((letter, index) => ({
    letter,
    isFake: false,
    isHidden: index === hiddenLetterIndex
  }));

  if (level >= FAKE_LETTER_LEVEL_START) {
    const randomIndex = Math.floor(Math.random() * letterObject.length);
    letterObject.splice(randomIndex, 0, { letter: fakeLetter, isFake: true, isHidden: false });
  }

  for (let i = letterObject.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letterObject[i], letterObject[j]] = [letterObject[j], letterObject[i]];
  }

  return letterObject;
};

const useShuffledWord = (word: string, intervalTime: number, shouldShuffle: boolean) => {
  const { level, hiddenLetterIndex } = useGameStore();

  const [shuffledWordObject, setShuffledWordObject] = useState<ShuffledWordObjectType[]>([]);
  const [initialShuffledWord, setInitialShuffledWord] = useState<string[]>([]);
  const [fakeLetter, setFakeLetter] = useState<string>('');

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

    const initialLetterObject = createLetterObject(word, level, fakeLetter, hiddenLetterIndex);
    setShuffledWordObject(initialLetterObject);

    if (!shouldShuffle) return;

    const shuffleAndAddLetter = () => {
      let letterObject = createLetterObject(word, level, fakeLetter, hiddenLetterIndex);
      letterObject = letterObject.sort(() => Math.random() - 0.5);
      setShuffledWordObject(letterObject);

      const audio = new Audio(shuffleSound);
      audio.play();
    };

    const interval = setInterval(shuffleAndAddLetter, intervalTime);
    return () => clearInterval(interval);
  }, [word, intervalTime, shouldShuffle, initialShuffledWord, fakeLetter, level, hiddenLetterIndex]);

  return shuffledWordObject;
};

export default useShuffledWord;
