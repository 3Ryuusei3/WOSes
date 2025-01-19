import { useState } from "react";

import Mode from "../types/Mode";

import { START_TIME } from "../constant";

const useGameVariables = () => {
  const [mode, setMode] = useState<Mode>('start');
  const [playerName, setPlayerName] = useState('');
  const [gameTime, setGameTime] = useState(START_TIME);
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
