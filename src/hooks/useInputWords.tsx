import { useState } from 'react';

const useInputWords = (possibleWords: string[]) => {
  const [inputWord, setInputWord] = useState('');
  const [inputtedWords, setInputtedWords] = useState<string[]>([]);
  const [correctWords, setCorrectWords] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputWord.trim() !== '') {
      if (possibleWords.includes(inputWord.trim()) && !correctWords.includes(inputWord.trim())) {
        setCorrectWords([...correctWords, inputWord.trim()]);
      }
      setInputtedWords([...inputtedWords, inputWord.trim()]);
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
