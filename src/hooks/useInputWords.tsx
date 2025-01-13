import { useState } from 'react';

const useInputWords = (possibleWords: string[]) => {
  const [inputWord, setInputWord] = useState('');
  const [inputtedWords, setInputtedWords] = useState<string[]>([]);
  const [correctWords, setCorrectWords] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(e.target.value.toLowerCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputWord.trim() !== '') {
      const trimmedWord = inputWord.trim();
      if (possibleWords.includes(trimmedWord) && !correctWords.includes(trimmedWord)) {
        setCorrectWords([...correctWords, trimmedWord]);
      }
      setInputtedWords([...inputtedWords, trimmedWord]);
      setInputWord('');
    }
  };

  return {
    inputWord,
    inputtedWords,
    correctWords,
    handleChange,
    handleKeyDown,
  };
};

export default useInputWords;
