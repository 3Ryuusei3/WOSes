import useGameStore from "../store/useGameStore";
import {
  generateAlexLevels,
  ALEX_LEVEL_TIME,
  AlexLevel,
} from "../constant/alex";

export default function useAlexRun() {
  const {
    setPlayers,
    setGameDifficulty,
    setGameMechanics,
    setGameTime,
    setLevel,
    setTotalPoints,
    setNumberOfPerfectRounds,
    setNumberOfRounds,
    setLevelsToAdvance,
    setPreviousRoundsWords,
    setMode,
    setAlexLevels,
    setAlexCurrentLevelIndex,
    setAlexCompleted,
    setDailyChallengeOriginalDifficulty,
    setDailyChallengeWord,
    setDailyChallengeInitialTime,
    setCurrentChallengeNumber,
  } = useGameStore();

  const applyLevelToStore = (level: AlexLevel, index: number) => {
    setGameMechanics({ ...level.mechanics });
    setGameTime(level.timeSeconds);
    setLevel(index + 1);
    setLevelsToAdvance(0);
  };

  const startAlexRun = () => {
    const levels = generateAlexLevels();
    setAlexLevels(levels);
    setAlexCurrentLevelIndex(0);
    setAlexCompleted(false);

    setPlayers("single");
    setGameDifficulty("alex");

    setCurrentChallengeNumber(null);
    setDailyChallengeWord(null);
    setDailyChallengeOriginalDifficulty(null);
    setDailyChallengeInitialTime(null);

    setTotalPoints(0);
    setNumberOfPerfectRounds(0);
    setNumberOfRounds(0);
    setPreviousRoundsWords([]);

    applyLevelToStore(levels[0], 0);

    setMode("loading");
  };

  const advanceAlexLevel = () => {
    const state = useGameStore.getState();
    const nextIndex = state.alexCurrentLevelIndex + 1;
    const levels = state.alexLevels;

    if (nextIndex >= levels.length) {
      setAlexCompleted(true);
      setMode("lost");
      return;
    }

    setAlexCurrentLevelIndex(nextIndex);
    applyLevelToStore(levels[nextIndex], nextIndex);
    setMode("loading");
  };

  const resetAlexRun = () => {
    setAlexLevels([]);
    setAlexCurrentLevelIndex(0);
    setAlexCompleted(false);
    setGameDifficulty("medium");
    setGameTime(ALEX_LEVEL_TIME);
  };

  return {
    startAlexRun,
    advanceAlexLevel,
    resetAlexRun,
  };
}
