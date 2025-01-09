import { useState } from 'react';

const useInputWords = (possibleWords: string[]) => {
  const [inputWord, setInputWord] = useState('');
  const [inputtedWords, setInputtedWords] = useState<string[]>([]);
  const [correctWords, setCorrectWords] = useState<string[]>([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(event.target.value.toLowerCase());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputWord.trim() !== '') {
      setInputtedWords([...inputtedWords, inputWord.trim()]);
      if (possibleWords.includes(inputWord.trim())) {
        setCorrectWords([...correctWords, inputWord.trim()]);
      }
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
