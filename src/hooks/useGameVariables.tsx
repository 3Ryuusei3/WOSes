import { useState } from "react";

const useGameVariables = () => {
  const [mode, setMode] = useState<'start' | 'lobby' | 'game' | 'lost'>('start');
  const [playerName, setPlayerName] = useState('');
  const [lastRoundPoints, setLastRoundPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  return { mode, setMode, playerName, setPlayerName, totalPoints, setTotalPoints, lastRoundPoints, setLastRoundPoints };
}

export default useGameVariables;
