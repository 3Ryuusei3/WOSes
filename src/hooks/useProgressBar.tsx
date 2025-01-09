import { useState, useEffect } from 'react';

const useProgressBar = (duration: number) => {
  const [timeLeft, setTimeLeft] = useState(duration * 1000);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 10);
    }, 10);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const percentage = (timeLeft / (duration * 1000)) * 100;

  return { timeLeft, percentage };
};

export default useProgressBar;
