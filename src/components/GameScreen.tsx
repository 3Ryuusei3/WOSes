import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import PlayerGameView from "./game/PlayerGameView";
import HostGameView from "./game/HostGameView";

import useShuffledWord from "./../hooks/useShuffledWord";
import useInputWords from "./../hooks/useInputWords";
import useProgressBar from "./../hooks/useProgressBar";
import useRoomStateSync from "../hooks/useRoomStateSync";
import useRealtimeConnection from "../hooks/useRealtimeConnection";
import useGameEngine from "../hooks/useGameEngine";
import useSyncManager from "../hooks/useSyncManager";

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
  subscribeToCorrectWords,
  getPlayerNameById,
  finishRoundToLobby,
  finishRoundToLost,
  getLatestRoundId,
  getRoundWords,
  subscribeToRoom,
} from "../services/multiplayer";

export default function GameScreen() {
  const { i18n } = useTranslation();
  const {
    mode,
    playerName,
    role,
    players,
    roomCode,
    roomId,
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

  const { percentage, timeLeft } = useProgressBar(gameTime);
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
  const syncManager = useSyncManager();

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
  const wordsChannelRef = useRef<ReturnType<
    typeof subscribeToCorrectWords
  > | null>(null);
  const roomChannelRef = useRef<ReturnType<typeof subscribeToRoom> | null>(
    null,
  );
  const markWordGuessedRef = useRef(markWordGuessed);
  const currentRoundIdRef = useRef<number | null>(null);
  const hostPrevGuessedRef = useRef<number>(0);
  const isEndingLevelRef = useRef<boolean>(false);
  const wordsRef = useRef(words);

  const playerRoundPoints = 0; // Ahora se calcula en PlayerGameView

  // Mantener refs actualizados
  useEffect(() => {
    markWordGuessedRef.current = markWordGuessed;
    wordsRef.current = words;
  }, [markWordGuessed, words]);

  // Sincronización MANUAL para jugadores (solo cuando presionan botón)
  const handleGameStateSync = useCallback(
    async (newState: {
      state?: string;
      current_word?: string;
      difficulty?: string;
    }) => {
      if (newState.state === "lobby" || newState.state === "lost") {
        if (currentRoundIdRef.current && roomId) {
          try {
            // Usar SyncManager para sincronizar estado completo
            const updatedWords = await syncManager.syncCompleteRoundState(
              roomId,
              currentRoundIdRef.current,
              wordsRef.current,
              [],
            );

            setLastLevelWords(updatedWords);
          } catch (error) {
            setLastLevelWords(wordsRef.current);
          }
        }
        setLastRoundPoints(0);
      }

      if (newState.state === "lobby") {
        setMode("lobby");
      } else if (newState.state === "lost") {
        setMode("lost");
      }
    },
    [setMode, roomId, setLastLevelWords, setLastRoundPoints, syncManager],
  );

  const { syncNow, isSyncing } = useRoomStateSync(roomId, handleGameStateSync);

  // Detectar estado de conexión y auto-sincronizar al reconectar
  const { status: connectionStatus } = useRealtimeConnection({
    onReconnect: () => {
      if (isPlayer) {
        syncNow();
      }
    },
  });

  // Mostrar botón siempre para jugadores
  const showReconnectButton = isPlayer;

  useEffect(() => {
    markWordGuessedRef.current = markWordGuessed;
  }, [markWordGuessed]);

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
    // En multiplayer, el host debe verificar el conteo del servidor, no su estado local
    if (players === "multi" && role === "host" && roomId) {
      try {
        const { data: roundId } = await getLatestRoundId(roomId);
        if (roundId) {
          const { data: roundWords } = await getRoundWords(roomId, roundId);
          if (roundWords) {
            const serverCorrectWords = roundWords
              .filter((w) => w.status === "correct")
              .map((w) => w.word);

            const serverStats = gameEngine.getCurrentLevelStats(
              possibleWords,
              serverCorrectWords,
            );

            return serverStats.hasReachedGoal || serverStats.isPerfect;
          }
        }
      } catch (error) {
        console.error("Error checking server completion status:", error);
      }
    }

    // Fallback para singleplayer o en caso de error
    return hasReachedGoal || levelStats.isPerfect;
  }, [
    hasReachedGoal,
    levelStats.isPerfect,
    players,
    role,
    roomId,
    gameEngine,
    possibleWords,
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
        finishRoundToLobby(roomCode);
      }
    } else {
      endGameAndSaveScore(finalPoints);
      if (players === "multi" && role === "host" && roomCode) {
        finishRoundToLost(
          roomCode,
          level,
          finalPoints,
          numberOfRounds,
          numberOfPerfectRounds,
        );
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

  // Suscripción a correct words para la ronda actual únicamente
  useEffect(() => {
    (async () => {
      if (roomId && !wordsChannelRef.current) {
        const { data: currentRoundId } = await getLatestRoundId(roomId);
        currentRoundIdRef.current = currentRoundId ?? null;

        if (currentRoundIdRef.current) {
          // Usar SyncManager para cargar palabras con retry
          const roundWords = await syncManager.loadRoundWordsWithRetry(
            roomId,
            currentRoundIdRef.current,
          );

          if (roundWords) {
            // Marcar las correctas de inicio
            for (const rw of roundWords) {
              if (rw.status === "correct") {
                markWordGuessedRef.current(rw.word, "");
              }
            }
          } else {
            console.warn("Failed to load round words after multiple attempts");
          }
        }
        wordsChannelRef.current = subscribeToCorrectWords(
          roomId,
          async (payload: any) => {
            const newRow = payload.new;
            if (
              newRow &&
              newRow.status === "correct" &&
              newRow.round_id === currentRoundIdRef.current
            ) {
              let name = "";
              if (newRow.player_id) {
                const { data } = await getPlayerNameById(newRow.player_id);
                name = (data as any)?.name || "";
              }
              // Host: play success sound immediately on new correct
              const state = useGameStore.getState();
              if (state.players === "multi" && state.role === "host") {
                if (!hitAudioRef.current) {
                  hitAudioRef.current = new Audio(hitSound);
                }
                if (hitAudioRef.current && effectiveVolume > 0) {
                  try {
                    hitAudioRef.current.currentTime = 0;
                    await hitAudioRef.current.play();
                  } catch (_) {}
                }
              }
              markWordGuessedRef.current(newRow.word, name);
            }
          },
        );
      }
    })();
    return () => {
      if (wordsChannelRef.current) {
        wordsChannelRef.current.unsubscribe();
        wordsChannelRef.current = null;
      }
    };
  }, [roomId]);

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

  // Sincronización en tiempo real del estado de la room (para multiplayer)
  useEffect(() => {
    if (!roomId || players !== "multi") return;

    if (!roomChannelRef.current) {
      roomChannelRef.current = subscribeToRoom(roomId, async (payload: any) => {
        const newState = (payload.new as any)?.state as string | undefined;

        if (!newState) return;

        // Prevenir transiciones redundantes
        if (
          (newState === "loading" && mode === "loading") ||
          (newState === "game" && mode === "game") ||
          (newState === "lobby" && mode === "lobby") ||
          (newState === "lost" && mode === "lost")
        ) {
          return;
        }

        // Players: cargar palabras del servidor antes de cambiar a lobby/lost
        if (
          role === "player" &&
          (newState === "lobby" || newState === "lost")
        ) {
          if (currentRoundIdRef.current) {
            try {
              // Usar SyncManager para sincronizar estado completo
              const updatedWords = await syncManager.syncCompleteRoundState(
                roomId,
                currentRoundIdRef.current,
                wordsRef.current,
                [],
              );

              setLastLevelWords(updatedWords);
            } catch (error) {
              setLastLevelWords(wordsRef.current);
            }
          }
          setLastRoundPoints(playerRoundPoints);
        }

        if (newState === "loading") {
          setMode("loading");
        } else if (newState === "game") {
          setMode("game");
        } else if (newState === "lobby") {
          setMode("lobby");
        } else if (newState === "lost") {
          setMode("lost");
        }
      });
    }

    return () => {
      if (roomChannelRef.current) {
        roomChannelRef.current.unsubscribe();
        roomChannelRef.current = null;
      }
    };
  }, [
    roomId,
    players,
    role,
    mode,
    setMode,
    playerRoundPoints,
    setLastLevelWords,
    setLastRoundPoints,
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
