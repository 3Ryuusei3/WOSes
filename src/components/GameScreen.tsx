import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import PlayerGameView from "./game/PlayerGameView";
import HostGameView from "./game/HostGameView";

import useShuffledWord from "./../hooks/useShuffledWord";
import useInputWords from "./../hooks/useInputWords";
import useProgressBar from "./../hooks/useProgressBar";
import useRealtimeConnection from "../hooks/useRealtimeConnection";
import useGameEngine from "../hooks/useGameEngine";

import useGameStore from "../store/useGameStore";

import { calculateProbability } from "../utils";
import { insertScoreWithNextId } from "../services/rooms";
import { saveDailyChallengeScore } from "../services/dailyChallenge";

import { SHOW_LETTERS_RANGE, SHUFFLE_INTERVAL } from "../constant";

import hitSound from "../assets/hit.mp3";
import goalSound from "../assets/goal.mp3";
import revealSound from "../assets/reveal.mp3";
import endSound from "../assets/end.mp3";
import {
  finishRoundToLobby,
  finishRoundToLost,
  withRetry,
} from "../services/multiplayer";
import {
  roomRealtime,
  useRoomRealtimeStore,
  selectCurrentRoundWords,
  serverIsoToLocalMs,
} from "../realtime/roomRealtime";
import { showToast } from "../atoms/Toast";

export default function GameScreen() {
  const { i18n } = useTranslation();
  const {
    mode,
    playerName,
    role,
    players,
    roomCode,
    playerId,
    setMode,
    gameTime,
    randomWord,
    possibleWords,
    totalPoints,
    setTotalPoints,
    setLastRoundPoints,
    level,
    setLevel,
    levelsToAdvance,
    setLevelsToAdvance,
    setLastLevelWords,
    lastLevelWords,
    gameMechanics,
    gameDifficulty,
    volume,
    numberOfRounds,
    numberOfPerfectRounds,
    setPreviousRoundsWords,
    currentChallengeNumber,
    dailyChallengeOriginalDifficulty,
  } = useGameStore();

  const isPlayer = players === "multi" && role === "player";
  const effectiveVolume = isPlayer ? 0 : volume;

  const showLettersPercentage = calculateProbability(level, SHOW_LETTERS_RANGE);

  // Multijugador: todos los dispositivos cuentan desde la hora de inicio de la
  // ronda en el servidor y con la misma duración (la que fijó el host).
  const rtRound = useRoomRealtimeStore((s) => s.round);
  const clockOffsetMs = useRoomRealtimeStore((s) => s.clockOffsetMs);
  const isMulti = players === "multi";
  const roundDuration =
    isMulti && rtRound?.duration_seconds ? rtRound.duration_seconds : gameTime;
  const roundStartedAtMs =
    isMulti && rtRound?.started_at
      ? serverIsoToLocalMs(rtRound.started_at, clockOffsetMs)
      : undefined;
  const { percentage, timeLeft } = useProgressBar(
    roundDuration,
    roundStartedAtMs,
  );
  const shuffledWordObject = useShuffledWord(
    randomWord,
    gameMechanics,
    SHUFFLE_INTERVAL,
    percentage > 0,
    possibleWords,
    lastLevelWords,
    levelsToAdvance,
    effectiveVolume,
  );
  const {
    inputWord,
    words,
    correctWords,
    handleChange,
    handleKeyDown,
    markWordGuessed,
    clearInput,
  } = useInputWords(possibleWords);
  const gameEngine = useGameEngine();

  // Calcular estadísticas del nivel usando GameEngine
  const levelStats = useMemo(() => {
    return gameEngine.getCurrentLevelStats(possibleWords, correctWords);
  }, [possibleWords, correctWords, gameEngine]);

  const { currentPoints, goalPoints, levelPoints, hasReachedGoal } = levelStats;
  const correctWordsPoints = useCallback(() => currentPoints, [currentPoints]);

  const [hasPlayedGoalSound, setHasPlayedGoalSound] = useState(false);
  const [hasPlayedRevealSound, setHasPlayedRevealSound] = useState(false);
  const [hasPlayedEndSound, setHasPlayedEndSound] = useState(false);
  const hasCalledEndOfLevelRef = useRef(false);
  const hostPrevGuessedRef = useRef<number>(0);
  const isEndingLevelRef = useRef<boolean>(false);
  const wordsRef = useRef(words);

  const playerRoundPoints = 0; // Ahora se calcula en PlayerGameView

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  const {
    status: connectionStatus,
    syncNow,
    isSyncing,
  } = useRealtimeConnection();
  const showReconnectButton = isPlayer;

  // Resetear la bandera al entrar en modo game (nueva ronda)
  useEffect(() => {
    if (mode === "game") {
      isEndingLevelRef.current = false;
      hasCalledEndOfLevelRef.current = false;
    }
  }, [mode]);

  const hitAudioRef = useRef<HTMLAudioElement | null>(null);
  const goalAudioRef = useRef<HTMLAudioElement | null>(null);
  const revealAudioRef = useRef<HTMLAudioElement | null>(null);
  const endAudioRef = useRef<HTMLAudioElement | null>(null);

  const updateLastLevelWordsAndPoints = useCallback(() => {
    setTotalPoints((prev) => prev + currentPoints);
    setLastLevelWords(words);
  }, [currentPoints, setTotalPoints, setLastLevelWords, words]);

  const updateHighscoreDB = useCallback(
    async (finalPoints: number) => {
      try {
        const createdAt = new Date().toISOString();
        const language = i18n.language;
        const { error } = await insertScoreWithNextId(
          playerName,
          finalPoints,
          level,
          gameDifficulty,
          language,
          createdAt,
          numberOfRounds,
          numberOfPerfectRounds,
        );
        if (error) throw error;
      } catch (error) {
        console.error("Error inserting highscore:", error);
      }
    },
    [
      playerName,
      level,
      gameDifficulty,
      i18n.language,
      numberOfRounds,
      numberOfPerfectRounds,
    ],
  );

  const hasCompletedLevel = useCallback(async () => {
    // En multijugador el host comprueba con las palabras del servidor
    if (players === "multi" && role === "host") {
      await roomRealtime.resync();
      const serverCorrect = selectCurrentRoundWords(
        useRoomRealtimeStore.getState(),
      ).map((w) => w.word);
      const merged = Array.from(new Set([...serverCorrect, ...correctWords]));
      const serverStats = gameEngine.getCurrentLevelStats(possibleWords, merged);
      return serverStats.hasReachedGoal || serverStats.isPerfect;
    }

    return hasReachedGoal || levelStats.isPerfect;
  }, [
    hasReachedGoal,
    levelStats.isPerfect,
    players,
    role,
    gameEngine,
    possibleWords,
    correctWords,
  ]);

  const advanceToNextLevel = useCallback(
    (levelsAdded: number) => {
      setLevelsToAdvance(levelsAdded);
      setLevel((prev: number) => prev + levelsAdded);
      setLastRoundPoints(currentPoints);
      updateLastLevelWordsAndPoints();
      setMode("lobby");
      setPreviousRoundsWords((prevWords) => [...prevWords, randomWord]);
    },
    [
      setLevelsToAdvance,
      setLevel,
      setLastRoundPoints,
      currentPoints,
      updateLastLevelWordsAndPoints,
      setMode,
      randomWord,
      setPreviousRoundsWords,
    ],
  );

  const endGameAndSaveScore = useCallback(
    (finalPoints: number, currentTimeRemaining?: number) => {
      updateLastLevelWordsAndPoints();
      if (players === "single") {
        if (gameDifficulty === "daily") {
          // Obtener valores actuales del store
          const { dailyChallengeInitialTime, gameTime: storeGameTime } =
            useGameStore.getState();

          // Usar el tiempo pasado como parámetro, o el del store como fallback
          const actualTimeRemaining =
            currentTimeRemaining !== undefined
              ? currentTimeRemaining
              : storeGameTime;

          // El tiempo transcurrido es: tiempo_inicial - tiempo_restante_actual
          const timeElapsed =
            (dailyChallengeInitialTime || 0) - actualTimeRemaining;

          saveDailyChallengeScore({
            name: playerName,
            score: finalPoints,
            challenge_number: currentChallengeNumber!,
            time_elapsed: timeElapsed,
            language: i18n.language,
            perfects: numberOfPerfectRounds,
          }).catch((error) => {
            console.error("Error saving daily challenge score:", error);
          });
        } else {
          updateHighscoreDB(finalPoints);
        }
      }
      setMode("lost");
      setPreviousRoundsWords([]);
    },
    [
      updateLastLevelWordsAndPoints,
      updateHighscoreDB,
      setMode,
      players,
      gameDifficulty,
      playerName,
      currentChallengeNumber,
      i18n.language,
      numberOfPerfectRounds,
      setPreviousRoundsWords,
    ],
  );

  const handleEndOfLevel = useCallback(async () => {
    if (isEndingLevelRef.current) return;
    isEndingLevelRef.current = true;

    const finalPoints = totalPoints + currentPoints;

    if (gameDifficulty === "daily") {
      endGameAndSaveScore(finalPoints);
      return;
    }

    if (await hasCompletedLevel()) {
      const levelsAdded = gameEngine.getLevelAdvanceInfo(
        levelStats.completionPercentage,
        level,
      ).levelsToAdvance;

      advanceToNextLevel(levelsAdded);

      if (players === "multi" && role === "host" && roomCode) {
        const { error } = await withRetry(() => finishRoundToLobby(roomCode));
        if (error) {
          showToast("No se pudo avisar a los jugadores del fin de ronda", "error");
        }
      }
    } else {
      endGameAndSaveScore(finalPoints);
      if (players === "multi" && role === "host" && roomCode) {
        const { error } = await withRetry(() =>
          finishRoundToLost(
            roomCode,
            level,
            finalPoints,
            numberOfRounds,
            numberOfPerfectRounds,
          ),
        );
        if (error) {
          showToast("No se pudo avisar a los jugadores del fin de partida", "error");
        }
      }
    }
  }, [
    totalPoints,
    currentPoints,
    hasCompletedLevel,
    levelStats.completionPercentage,
    level,
    advanceToNextLevel,
    endGameAndSaveScore,
    players,
    role,
    roomCode,
    gameDifficulty,
    gameEngine,
    numberOfRounds,
    numberOfPerfectRounds,
  ]);

  useEffect(() => {
    if (!hitAudioRef.current) {
      hitAudioRef.current = new Audio(hitSound);
    }
    if (!goalAudioRef.current) {
      goalAudioRef.current = new Audio(goalSound);
    }
    if (!revealAudioRef.current) {
      revealAudioRef.current = new Audio(revealSound);
    }
    if (!endAudioRef.current) {
      endAudioRef.current = new Audio(endSound);
    }

    return () => {
      if (goalAudioRef.current) {
        goalAudioRef.current.pause();
        goalAudioRef.current.currentTime = 0;
      }
      if (revealAudioRef.current) {
        revealAudioRef.current.pause();
        revealAudioRef.current.currentTime = 0;
      }
      if (endAudioRef.current) {
        endAudioRef.current.pause();
        endAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (hitAudioRef.current) {
      hitAudioRef.current.volume = effectiveVolume;
    }
    if (goalAudioRef.current) {
      goalAudioRef.current.volume = effectiveVolume;
    }
    if (revealAudioRef.current) {
      revealAudioRef.current.volume = effectiveVolume;
    }
    if (endAudioRef.current) {
      endAudioRef.current.volume = effectiveVolume;
    }
  }, [effectiveVolume]);

  // Host: play a short success sound whenever a new word gets revealed
  useEffect(() => {
    if (players === "multi" && role === "host") {
      const guessedCount = words.filter((w) => w.guessed).length;
      if (guessedCount > hostPrevGuessedRef.current) {
        if (hitAudioRef.current && effectiveVolume > 0) {
          try {
            hitAudioRef.current.currentTime = 0;
            hitAudioRef.current.play().catch(() => {});
          } catch (_) {}
        }
      }
      hostPrevGuessedRef.current = guessedCount;
    }
  }, [words, players, role, effectiveVolume]);

  // Palabras acertadas de la ronda (vienen del servidor vía roomRealtime)
  const roundCorrectWords = useRoomRealtimeStore(selectCurrentRoundWords);
  useEffect(() => {
    if (players !== "multi") return;
    const guessed = new Set(
      wordsRef.current.filter((w) => w.guessed).map((w) => w.word),
    );
    for (const cw of roundCorrectWords) {
      if (!guessed.has(cw.word)) markWordGuessed(cw.word, cw.player_name);
    }
    // markWordGuessed cambia en cada render; solo nos interesan palabras nuevas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundCorrectWords, players]);

  // Gestión principal de fin de nivel y sonidos
  useEffect(() => {
    // Solo para singleplayer o host: detectar fin de nivel
    const shouldHandleEndOfLevel =
      players === "single" || (players === "multi" && role === "host");

    if (shouldHandleEndOfLevel) {
      const timeEnded = percentage === 0;
      const allWordsGuessed =
        levelPoints > 0 && correctWords.length === possibleWords.length;

      if ((timeEnded || allWordsGuessed) && !hasCalledEndOfLevelRef.current) {
        hasCalledEndOfLevelRef.current = true;

        if (gameDifficulty === "daily") {
          const timeRemainingSeconds = Math.floor(timeLeft / 1000);
          useGameStore.setState({ gameTime: timeRemainingSeconds });
        }

        handleEndOfLevel();
      }
    }

    // Sonidos (solo para singleplayer y host)
    if (players === "single" || (players === "multi" && role === "host")) {
      if (
        levelPoints > 0 &&
        correctWordsPoints() >= goalPoints &&
        !hasPlayedGoalSound
      ) {
        if (goalAudioRef.current) {
          goalAudioRef.current.currentTime = 0;
          goalAudioRef.current.play().catch(() => {});
        }
        setHasPlayedGoalSound(true);
      }

      const anyMechanicsActive = Object.values(gameMechanics).some(
        (value) => value,
      );
      if (
        anyMechanicsActive &&
        percentage <= showLettersPercentage &&
        !hasPlayedRevealSound
      ) {
        if (revealAudioRef.current) {
          revealAudioRef.current.currentTime = 0;
          revealAudioRef.current.play().catch(() => {});
        }
        setHasPlayedRevealSound(true);
      }

      if (timeLeft <= 3000 && !hasPlayedEndSound) {
        if (endAudioRef.current) {
          endAudioRef.current.currentTime = 0;
          endAudioRef.current.play().catch(() => {});
        }
        setHasPlayedEndSound(true);
      }
    }
  }, [
    percentage,
    levelPoints,
    correctWordsPoints,
    goalPoints,
    hasPlayedGoalSound,
    hasPlayedRevealSound,
    hasPlayedEndSound,
    showLettersPercentage,
    timeLeft,
    correctWords.length,
    possibleWords.length,
    gameMechanics,
    handleEndOfLevel,
    players,
    role,
  ]);

  return (
    <>
      {players === "multi" && role === "player" ? (
        <PlayerGameView
          playerRoundPoints={playerRoundPoints}
          showReconnectButton={showReconnectButton}
          connectionStatus={connectionStatus}
          syncNow={syncNow}
          isSyncing={isSyncing}
          inputWord={inputWord}
          handleChange={handleChange}
          clearInput={clearInput}
          possibleWords={possibleWords}
          words={words}
          playerId={playerId}
          roomCode={roomCode}
          markWordGuessed={markWordGuessed}
          percentage={percentage}
        />
      ) : (
        <HostGameView
          words={words}
          correctWordsPoints={correctWordsPoints}
          goalPoints={goalPoints}
          level={level}
          gameDifficulty={gameDifficulty}
          dailyChallengeOriginalDifficulty={dailyChallengeOriginalDifficulty}
          gameMechanics={gameMechanics}
          shuffledWordObject={shuffledWordObject}
          percentage={percentage}
          showLettersPercentage={showLettersPercentage}
          timeLeft={timeLeft}
          playerName={playerName}
          players={players as "single" | "multi"}
          inputWord={inputWord}
          handleChange={handleChange}
          handleKeyDown={handleKeyDown}
          possibleWords={possibleWords}
          correctWords={correctWords}
          volume={volume}
        />
      )}
    </>
  );
}
