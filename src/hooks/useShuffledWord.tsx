import { useState, useEffect } from 'react';

const shuffleString = (str: string) => {
  return str.split('').sort(() => Math.random() - 0.5).join('');
};

const useShuffledWord = (word: string, intervalTime: number, shouldShuffle: boolean) => {
  const [shuffledWord, setShuffledWord] = useState<string>('');

  useEffect(() => {
    if (!shouldShuffle) return;

    setShuffledWord(shuffleString(word));

    const interval = setInterval(() => {
      setShuffledWord(shuffleString(word));
    }, intervalTime);

    return () => clearInterval(interval);
  }, [word, intervalTime, shouldShuffle]);

  return shuffledWord;
};

export default useShuffledWord;
