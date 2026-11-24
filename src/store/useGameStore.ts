import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import Mode from "../types/Mode";
import Role from "../types/Role";
import Word from "../types/Word";
import Mechanics from "../types/Mechanics";
import Difficulty from "../types/Difficulty";

import { START_TIME } from "../constant";
import { isMobileUserAgent } from "../utils/mobileUserAgent";

interface GameState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  playerId: number | null;
  setPlayerId: (id: number | null) => void;
  roundId: number | null;
  setRoundId: (id: number | null) => void;
  players: string;
  setPlayers: (players: string) => void;
  roomCode: string;
  setRoomCode: (code: string) => void;
  roomId: number | null;
  setRoomId: (id: number | null) => void;
  role: Role | null;
  setRole: (role: Role | null) => void;
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
  gameMechanics: Mechanics;
  setGameMechanics: (difficulty: Mechanics) => void;
  gameDifficulty: Difficulty;
  setGameDifficulty: (difficulty: Difficulty) => void;
  numberOfRounds: number;
  setNumberOfRounds: (rounds: number | ((prev: number) => number)) => void;
  numberOfPerfectRounds: number;
  setNumberOfPerfectRounds: (
    rounds: number | ((prev: number) => number),
  ) => void;
  previousRoundsWords: string[];
  setPreviousRoundsWords: (
    words: string[] | ((prev: string[]) => string[]),
  ) => void;
  volume: number;
  /** Player name modal (header user button / first visit); not persisted */
  nameModalOpen: boolean;
  /** "Leave / back home" confirmation (button or browser back); not persisted */
  exitConfirmOpen: boolean;
  setExitConfirmOpen: (open: boolean) => void;
  setNameModalOpen: (open: boolean) => void;
  /** Creating a room: the host also plays (no main/shared screen) */
  hostPlays: boolean;
  setHostPlays: (hostPlays: boolean) => void;
  setVolume: (volume: number) => void;
  currentChallengeNumber: number | null;
  setCurrentChallengeNumber: (num: number | null) => void;
  dailyChallengeWord: string | null;
  setDailyChallengeWord: (word: string | null) => void;
  dailyChallengeOriginalDifficulty: Difficulty | null;
  setDailyChallengeOriginalDifficulty: (diff: Difficulty | null) => void;
  dailyChallengeInitialTime: number | null;
  setDailyChallengeInitialTime: (time: number | null) => void;
}

const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      mode: "start",
      setMode: (mode) => set({ mode }),
      playerName: "",
      setPlayerName: (name) => set({ playerName: name }),
      playerId: null,
      setPlayerId: (id) => set({ playerId: id }),
      roundId: null,
      setRoundId: (id) => set({ roundId: id }),
      players: "single",
      setPlayers: (players) => set({ players }),
      roomCode: "",
      setRoomCode: (code) => set({ roomCode: code }),
      roomId: null,
      setRoomId: (id) => set({ roomId: id }),
      role: null,
      setRole: (role) => set({ role }),
      randomWord: "",
      setRandomWord: (word) => set({ randomWord: word }),
      possibleWords: [],
      setPossibleWords: (words) => set({ possibleWords: words }),
      gameTime: START_TIME,
      setGameTime: (time) =>
        set((state) => ({
          gameTime: typeof time === "function" ? time(state.gameTime) : time,
        })),
      lastRoundPoints: 0,
      setLastRoundPoints: (points) => set({ lastRoundPoints: points }),
      totalPoints: 0,
      setTotalPoints: (points) =>
        set((state) => ({
          totalPoints:
            typeof points === "function" ? points(state.totalPoints) : points,
        })),
      level: 1,
      setLevel: (level) =>
        set((state) => ({
          level: typeof level === "function" ? level(state.level) : level,
        })),
      levelsToAdvance: 0,
      setLevelsToAdvance: (levels) => set({ levelsToAdvance: levels }),
      highestScore: { name: "", score: 0 },
      setHighestScore: (score) => set({ highestScore: score }),
      hiddenLetterIndex: 0,
      setHiddenLetterIndex: (letter) => set({ hiddenLetterIndex: letter }),
      lastLevelWords: [],
      setLastLevelWords: (words) => set({ lastLevelWords: words }),
      gameMechanics: {
        dark: false,
        fake: false,
        hidden: false,
        first: false,
        still: false,
        mirrored: false,
      },
      setGameMechanics: (difficulty) => set({ gameMechanics: difficulty }),
      gameDifficulty: "medium",
      setGameDifficulty: (difficulty) => set({ gameDifficulty: difficulty }),
      numberOfRounds: 0,
      setNumberOfRounds: (rounds) =>
        set((state) => ({
          numberOfRounds:
            typeof rounds === "function"
              ? rounds(state.numberOfRounds)
              : rounds,
        })),
      numberOfPerfectRounds: 0,
      setNumberOfPerfectRounds: (rounds) =>
        set((state) => ({
          numberOfPerfectRounds:
            typeof rounds === "function"
              ? rounds(state.numberOfPerfectRounds)
              : rounds,
        })),
      // Phones start muted (sound is opt-in there); desktop at 20%
      volume: isMobileUserAgent() ? 0 : 0.2,
      setVolume: (volume) => set({ volume }),
      exitConfirmOpen: false,
      setExitConfirmOpen: (exitConfirmOpen) => set({ exitConfirmOpen }),
      nameModalOpen: false,
      setNameModalOpen: (nameModalOpen) => set({ nameModalOpen }),
      hostPlays: false,
      setHostPlays: (hostPlays) => set({ hostPlays }),
      previousRoundsWords: [],
      setPreviousRoundsWords: (words) =>
        set((state) => ({
          previousRoundsWords:
            typeof words === "function"
              ? words(state.previousRoundsWords)
              : words,
        })),
      currentChallengeNumber: null,
      setCurrentChallengeNumber: (num) => set({ currentChallengeNumber: num }),
      dailyChallengeWord: null,
      setDailyChallengeWord: (word) => set({ dailyChallengeWord: word }),
      dailyChallengeOriginalDifficulty: null,
      setDailyChallengeOriginalDifficulty: (diff) =>
        set({ dailyChallengeOriginalDifficulty: diff }),
      dailyChallengeInitialTime: null,
      setDailyChallengeInitialTime: (time) =>
        set({ dailyChallengeInitialTime: time }),
    }),
    {
      name: "woses-game-storage",
      storage: createJSONStorage(() => localStorage),
      // v1: phones that already played get the sound off once (it used to
      // be on, with no way to turn it off on a phone)
      version: 1,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<GameState>;
        if (version < 1 && isMobileUserAgent()) state.volume = 0;
        return state as GameState;
      },
      partialize: (state) => ({
        playerName: state.playerName,
        volume: state.volume,
        gameDifficulty: state.gameDifficulty,
        // Remembered choice; also survives a reload of the host mid-game
        hostPlays: state.hostPlays,
      }),
    },
  ),
);

export default useGameStore;
