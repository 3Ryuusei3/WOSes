import { useEffect, useState } from 'react';
import useGameStore from '../store/useGameStore';
import { COUNTDOWN } from '../constant';
import { getRoomIdFromURL } from '../utils/index';

import supabase from '../config/supabaseClient';

const useCountdown = () => {
  const roomId = getRoomIdFromURL();
  const { setMode } = useGameStore();
  const [countdown, setCountdown] = useState(COUNTDOWN);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {

      supabase
        .from('rooms')
        .update({ mode: 'game' })
        .eq('room', roomId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating room:', error);
          }
        });
    }
  }, [countdown, setMode]);

  return countdown;
};

export default useCountdown;
