import { useState } from "react";

const useGameVariables = () => {
  const [mode, setMode] = useState<'start' | 'lobby' | 'game' | 'lost' | "loading">('start');
  const [playerName, setPlayerName] = useState('');
  const [lastRoundPoints, setLastRoundPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelsToAdvance, setLevelsToAdvance] = useState(0);

  return { mode, setMode, playerName, setPlayerName, totalPoints, setTotalPoints, lastRoundPoints, setLastRoundPoints, level, setLevel, levelsToAdvance, setLevelsToAdvance };
}

export default useGameVariables;
