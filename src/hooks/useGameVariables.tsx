import { useState } from "react";

const useGameVariables = () => {
  const [mode, setMode] = useState<'start' | 'lobby' | 'game' | 'lost' | "loading">('start');
  const [playerName, setPlayerName] = useState('');
  const [gameTime, setGameTime] = useState(75);
  const [lastRoundPoints, setLastRoundPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelsToAdvance, setLevelsToAdvance] = useState(0);
  const [highestScore, setHighestScore] = useState({
    name: '',
    score: 0
  });

  return {
    mode,
    setMode,
    playerName,
    setPlayerName,
    totalPoints,
    setTotalPoints,
    gameTime,
    setGameTime,
    lastRoundPoints,
    setLastRoundPoints,
    level,
    setLevel,
    levelsToAdvance,
    setLevelsToAdvance,
    highestScore,
    setHighestScore
  };
}

export default useGameVariables;
