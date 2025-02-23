import { useState } from 'react';
import Word from '../types/Word';

const useInputWords = (initialWords: string[]) => {
  const [inputWord, setInputWord] = useState('');
  const [words, setWords] = useState<Word[]>(
    initialWords.map(word => ({ word, guessed: false }))
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(e.target.value.toLowerCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputWord.trim() !== '') {
      const trimmedWord = inputWord.trim();
      setWords(prevWords => prevWords.map(wordObj =>
        wordObj.word === trimmedWord ? { ...wordObj, guessed: true } : wordObj
      ));
      setInputWord('');
    }
  };

  const correctWords = words.filter(w => w.guessed).map(w => w.word);

  return {
    inputWord,
    words,
    correctWords,
    handleChange,
    handleKeyDown,
  };
};

export default useInputWords;
