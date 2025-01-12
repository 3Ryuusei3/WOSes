import { useEffect, useState } from 'react';
import useGameStore from '../store/useGameStore';
import { COUNTDOWN } from '../contant';

const useCountdown = () => {
  const { setMode } = useGameStore();
  const [countdown, setCountdown] = useState(COUNTDOWN);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setMode('game');
    }
  }, [countdown, setMode]);

  return countdown;
};

export default useCountdown;
