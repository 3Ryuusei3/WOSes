import { create } from 'zustand';

import Mode from '../types/Mode';
import Word from '../types/Word';
import Difficulty from '../types/Difficulty';

import { START_TIME } from '../constant';

interface GameState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  randomWord: string;
  setRandomWord: (word: string) => void;
  possibleWords: string[];
  setPossibleWords: (words: string[]) => void;
  gameTime: number;
  setGameTime: (time: number | ((prev: number) => number)) => void;
  lastRoundPoints: number;
  setLastRoundPoints: (points: number) => void;
  totalPoints: number;
  setTotalPoints: (points: number | ((prev: number) => number)) => void;
  level: number;
  setLevel: (level: number | ((prev: number) => number)) => void;
  levelsToAdvance: number;
  setLevelsToAdvance: (levels: number) => void;
  highestScore: { name: string; score: number };
  setHighestScore: (score: { name: string; score: number }) => void;
  hiddenLetterIndex: number;
  setHiddenLetterIndex: (letter: number) => void;
  lastLevelWords: Word[];
  setLastLevelWords: (words: Word[]) => void;
  gameDifficulty: Difficulty;
  setGameDifficulty: (difficulty: Difficulty) => void;
}

const useGameStore = create<GameState>((set) => ({
  mode: 'start',
  setMode: (mode) => set({ mode }),
  playerName: '',
  setPlayerName: (name) => set({ playerName: name }),
  randomWord: '',
  setRandomWord: (word) => set({ randomWord: word }),
  possibleWords: [],
  setPossibleWords: (words) => set({ possibleWords: words }),
  gameTime: START_TIME,
  setGameTime: (time) => set((state) => ({
    gameTime: typeof time === 'function' ? time(state.gameTime) : time
  })),
  lastRoundPoints: 0,
  setLastRoundPoints: (points) => set({ lastRoundPoints: points }),
  totalPoints: 0,
  setTotalPoints: (points) => set((state) => ({
    totalPoints: typeof points === 'function' ? points(state.totalPoints) : points
  })),
  level: 1,
  setLevel: (level) => set((state) => ({
    level: typeof level === 'function' ? level(state.level) : level
  })),
  levelsToAdvance: 0,
  setLevelsToAdvance: (levels) => set({ levelsToAdvance: levels }),
  highestScore: { name: '', score: 0 },
  setHighestScore: (score) => set({ highestScore: score }),
  hiddenLetterIndex: 0,
  setHiddenLetterIndex: (letter) => set({ hiddenLetterIndex: letter }),
  lastLevelWords: [],
  setLastLevelWords: (words) => set({ lastLevelWords: words }),
  gameDifficulty: {
    dark: false,
    fake: false,
    hidden: false,
    first: false
  },
  setGameDifficulty: (difficulty) => set({ gameDifficulty: difficulty }),
}));

export default useGameStore;
