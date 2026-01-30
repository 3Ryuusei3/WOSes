import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import ScoreContainer from "../atoms/ScoreContainer";
import WordInput from "../atoms/WordInput";
import WarningMessage from "../atoms/WarningMessage";
import WordList from "../atoms/WordList";
import ProgressBar from "../atoms/ProgressBar";
import SelectedWord from "../atoms/SelectedWord";

import useShuffledWord from "./../hooks/useShuffledWord";
import useInputWords from "./../hooks/useInputWords";
import useProgressBar from "./../hooks/useProgressBar";
import useCalculatePoints from "./../hooks/useCalculatePoints";
import useRoomStateSync from "../hooks/useRoomStateSync";
import useRealtimeConnection from "../hooks/useRealtimeConnection";

import useGameStore from "../store/useGameStore";

import { calculateLevelsToAdvance, calculateProbability } from "../utils";
import { insertScoreWithNextId } from "../services/rooms";
import { saveDailyChallengeScore } from "../services/dailyChallenge";

import {
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHOW_LETTERS_RANGE,
  SHUFFLE_INTERVAL,
  getLanguageConstants,
} from "../constant";

import hitSound from "../assets/hit.mp3";
import goalSound from "../assets/goal.mp3";
import revealSound from "../assets/reveal.mp3";
import endSound from "../assets/end.mp3";
import GameSound from "../atoms/GameSound";
import {
  subscribeToCorrectWords,
  submitWord,
  getPlayerNameById,
  finishRoundToLobby,
  finishRoundToLost,
  getLatestRoundId,
  getRoundWords,
  subscribeToRoom,
} from "../services/multiplayer";
import reloadIcon from "../assets/reload.svg";

export default function GameScreen() {
  const { t, i18n } = useTranslation();
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
  const { correctWordsPoints, goalPoints, levelPoints } = useCalculatePoints(
    possibleWords,
    correctWords,
  );

  const [hasPlayedGoalSound, setHasPlayedGoalSound] = useState(false);
  const [hasPlayedRevealSound, setHasPlayedRevealSound] = useState(false);
  const [hasPlayedEndSound, setHasPlayedEndSound] = useState(false);
  const hasCalledEndOfLevelRef = useRef(false);
  const [playerAttempts, setPlayerAttempts] = useState<
    {
      word: string;
      status: "pending" | "correct" | "invalid" | "rejected" | "tip";
    }[]
  >([]);
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
  const playerAttemptsRef = useRef(playerAttempts);

  const playerRoundPoints = useMemo(() => {
    const { POINTS_PER_LETTER } = getLanguageConstants(i18n.language);
    return playerAttempts
      .filter((at) => at.status === "correct")
      .reduce(
        (sum, it) =>
          sum +
          it.word
            .split("")
            .reduce(
              (acc, letter) =>
                acc +
                POINTS_PER_LETTER[letter as keyof typeof POINTS_PER_LETTER],
              0,
            ),
        0,
      );
  }, [playerAttempts, i18n.language]);

  // Mantener refs actualizados
  useEffect(() => {
    markWordGuessedRef.current = markWordGuessed;
    wordsRef.current = words;
    playerAttemptsRef.current = playerAttempts;
  }, [markWordGuessed, words, playerAttempts]);

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
            const { data: roundWords } = await getRoundWords(
              roomId,
              currentRoundIdRef.current,
            );

            if (roundWords && roundWords.length > 0) {
              // Usar refs para obtener valores actuales
              const currentWords = wordsRef.current;
              const currentPlayerAttempts = playerAttemptsRef.current;

              const updatedWords = currentWords.map((w) => {
                // Verificar si el servidor dice que está correcta
                const serverWord = roundWords.find((rw) => rw.word === w.word);
                if (serverWord && serverWord.status === "correct") {
                  return { ...w, guessed: true };
                }

                // También marcar si el propio jugador la acertó localmente
                const playerCorrect = currentPlayerAttempts.find(
                  (pa) => pa.word === w.word && pa.status === "correct",
                );
                if (playerCorrect) {
                  return { ...w, guessed: true };
                }

                return w;
              });

              setLastLevelWords(updatedWords);
            } else {
              setLastLevelWords(wordsRef.current);
            }
          } catch (error) {
            setLastLevelWords(wordsRef.current);
          }
        }
        setLastRoundPoints(playerRoundPoints);
      }

      if (newState.state === "lobby") {
        setMode("lobby");
      } else if (newState.state === "lost") {
        setMode("lost");
      }
    },
    [setMode, roomId, playerRoundPoints, setLastLevelWords, setLastRoundPoints],
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
    setTotalPoints((prev) => prev + correctWordsPoints());
    setLastLevelWords(words);
  }, [correctWordsPoints, setTotalPoints, setLastLevelWords, words]);

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
          // Obtener las palabras correctas reales del servidor
          const { data: roundWords } = await getRoundWords(roomId, roundId);
          if (roundWords) {
            const serverCorrectWords = roundWords.filter(
              (w) => w.status === "correct",
            );
            const { POINTS_PER_LETTER } = getLanguageConstants(i18n.language);
            const serverPoints = serverCorrectWords.reduce((sum, w) => {
              return (
                sum +
                w.word
                  .split("")
                  .reduce(
                    (acc, letter) =>
                      acc +
                      POINTS_PER_LETTER[
                        letter as keyof typeof POINTS_PER_LETTER
                      ],
                    0,
                  )
              );
            }, 0);

            return (
              serverPoints >= goalPoints ||
              (levelPoints > 0 &&
                levelPoints === serverPoints &&
                serverCorrectWords.length >= possibleWords.length)
            );
          }
        }
      } catch (error) {
        console.error("Error checking server completion status:", error);
      }
    }

    // Fallback al comportamiento original para singleplayer o en caso de error
    return (
      correctWordsPoints() >= goalPoints ||
      (levelPoints > 0 &&
        levelPoints === correctWordsPoints() &&
        correctWords.length === possibleWords.length)
    );
  }, [
    correctWordsPoints,
    goalPoints,
    levelPoints,
    correctWords.length,
    possibleWords.length,
    players,
    role,
    roomId,
    i18n.language,
  ]);

  const advanceToNextLevel = useCallback(
    (levelsAdded: number) => {
      setLevelsToAdvance(levelsAdded);
      setLevel((prev: number) => prev + levelsAdded);
      setLastRoundPoints(correctWordsPoints());
      updateLastLevelWordsAndPoints();
      setMode("lobby");
      setPreviousRoundsWords((prevWords) => [...prevWords, randomWord]);
      // No resetear el tiempo aquí - useRemoveSeconds en GameLobby lo modificará según el rendimiento
      // El tiempo solo se resetea al inicio de una nueva partida en GameStart
    },
    [
      setLevelsToAdvance,
      setLevel,
      setLastRoundPoints,
      correctWordsPoints,
      updateLastLevelWordsAndPoints,
      setMode,
      randomWord,
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

    const finalPoints = totalPoints + correctWordsPoints();

    if (gameDifficulty === "daily") {
      endGameAndSaveScore(finalPoints);
      return;
    }

    if (await hasCompletedLevel()) {
      const completionPercentage = (correctWordsPoints() / levelPoints) * 100;
      const levelsAdded = calculateLevelsToAdvance(completionPercentage);
      advanceToNextLevel(levelsAdded);
      // Multiplayer: host mueve a lobby en BBDD y todos siguen por realtime
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
    correctWordsPoints,
    hasCompletedLevel,
    levelPoints,
    advanceToNextLevel,
    endGameAndSaveScore,
    players,
    role,
    roomCode,
    gameDifficulty,
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
        // Carga inicial solo de la ronda actual
        if (currentRoundIdRef.current) {
          // Para asegurar mismo tablero: obtener todas las palabras de la ronda
          // Retry con polling mejorado para manejar latencia en el seeding
          let roundWords = null;
          let attempts = 0;
          const maxAttempts = 15; // Aumentado de 5 a 15
          const baseDelay = 300; // Aumentado de 200ms a 300ms

          while (!roundWords && attempts < maxAttempts) {
            const { data } = await getRoundWords(
              roomId,
              currentRoundIdRef.current,
            );
            if (data && data.length > 0) {
              roundWords = data;
              break;
            }
            attempts++;
            if (attempts < maxAttempts) {
              // Exponential backoff: 300ms, 600ms, 1200ms, etc. (max 2s)
              const delay = Math.min(baseDelay * Math.pow(1.5, attempts), 2000);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }

          if (roundWords) {
            // Marcar las correctas de inicio
            for (const rw of roundWords) {
              if (rw.status === "correct") {
                markWordGuessedRef.current(rw.word, "");
              }
            }
          } else {
            console.warn(
              "Failed to load round words after",
              maxAttempts,
              "attempts",
            );
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
              let roundWords = null;
              let attempts = 0;
              const maxAttempts = 15;
              const baseDelay = 300;

              while (!roundWords && attempts < maxAttempts) {
                const { data } = await getRoundWords(
                  roomId,
                  currentRoundIdRef.current,
                );
                if (data && data.length > 0) {
                  roundWords = data;
                  break;
                }
                attempts++;
                if (attempts < maxAttempts) {
                  const delay = Math.min(
                    baseDelay * Math.pow(1.5, attempts),
                    2000,
                  );
                  await new Promise((resolve) => setTimeout(resolve, delay));
                }
              }

              if (roundWords) {
                // Usar refs para obtener valores actuales
                const currentWords = wordsRef.current;
                const currentPlayerAttempts = playerAttemptsRef.current;

                const updatedWords = currentWords.map((w) => {
                  // Verificar si el servidor dice que está correcta
                  const serverWord = roundWords.find(
                    (rw) => rw.word === w.word,
                  );
                  if (serverWord && serverWord.status === "correct") {
                    return { ...w, guessed: true };
                  }

                  // También marcar si el propio jugador la acertó localmente
                  const playerCorrect = currentPlayerAttempts.find(
                    (pa) => pa.word === w.word && pa.status === "correct",
                  );
                  if (playerCorrect) {
                    return { ...w, guessed: true };
                  }

                  return w;
                });

                setLastLevelWords(updatedWords);
              } else {
                setLastLevelWords(wordsRef.current);
              }
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
        <div className="game__container">
          <div className="h-section gap-xs">
            <button className="btn btn--deco btn--xs">
              {t("common.points")} {playerRoundPoints}
            </button>
            {showReconnectButton && (
              <button
                className={`btn btn--xs ml-auto ${connectionStatus !== "connected" ? "btn--lose" : ""}`}
                onClick={syncNow}
                disabled={isSyncing}
                title={
                  connectionStatus !== "connected"
                    ? t("game.reconnect")
                    : t("common.updateState")
                }
              >
                <span className="sr-only">{t("game.reconnect")}</span>
                <img
                  src={reloadIcon}
                  alt="reload"
                  className="player-selector"
                />
              </button>
            )}
          </div>
          <div className="v-section gap-sm w100 f-jc-c">
            <input
              type="text"
              className="mx-auto mt-auto"
              placeholder={t("game.inputWord")}
              value={inputWord}
              onChange={handleChange}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && inputWord.trim() !== "") {
                  const attempt = inputWord.trim().toLowerCase();
                  if (attempt.length < 4) {
                    clearInput();
                    return;
                  }
                  const isValid = possibleWords.includes(attempt);
                  const localWord = attempt;
                  clearInput();
                  const alreadySolvedGlobally = words.some(
                    (w) => w.word === localWord && w.guessed,
                  );
                  if (alreadySolvedGlobally) {
                    setPlayerAttempts((prev) => [
                      { word: localWord, status: "tip" as any },
                      ...prev,
                    ]);
                    return;
                  }

                  if (!isValid) {
                    setPlayerAttempts((prev) => [
                      { word: localWord, status: "invalid" },
                      ...prev,
                    ]);
                  } else if (isValid && playerId && roomCode) {
                    setPlayerAttempts((prev) => [
                      { word: localWord, status: "pending" },
                      ...prev,
                    ]);
                    const { data, error } = await submitWord(
                      roomCode,
                      playerId,
                      localWord,
                      true,
                    );
                    if (!error && data && (data as any).status === "correct") {
                      setPlayerAttempts((prev) =>
                        prev.map((it) =>
                          it.word === localWord
                            ? { ...it, status: "correct" }
                            : it,
                        ),
                      );
                      markWordGuessed(localWord);
                    } else {
                      setPlayerAttempts((prev) =>
                        prev.map((it) =>
                          it.word === localWord
                            ? { ...it, status: "rejected" }
                            : it,
                        ),
                      );
                    }
                  }
                }
              }}
              disabled={percentage === 0}
            />
            <div className="attemptList">
              {playerAttempts.map((it, idx) => (
                <h4
                  key={`${idx}-${it.word}`}
                  className={`${it.status === "correct" ? "highlight" : it.status === "tip" ? "tip" : "dark"} txt-center`}
                >
                  {it.word.toUpperCase()}
                </h4>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <ScoreContainer
            words={words}
            correctWordsPoints={correctWordsPoints}
            goalPoints={goalPoints}
            level={level}
            gameDifficulty={gameDifficulty}
            dailyChallengeOriginalDifficulty={dailyChallengeOriginalDifficulty}
          />
          <div className="game__container">
            <div className="v-section gap-xs">
              <div className="v-section gap-sm">
                <WarningMessage gameMechanics={gameMechanics} />
                <SelectedWord
                  shuffledWordObject={shuffledWordObject}
                  percentage={percentage}
                  gameMechanics={gameMechanics}
                  SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
                />
              </div>
              <ProgressBar
                timeLeft={timeLeft}
                percentage={percentage}
                RUNNING_OUT_OF_TIME_PERCENTAGE={RUNNING_OUT_OF_TIME_PERCENTAGE}
                SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
              />
            </div>
            <WordList
              words={words}
              playerName={playerName}
              percentage={percentage}
              gameMechanics={gameMechanics}
              SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
            />
            {players === "single" && (
              <WordInput
                inputWord={inputWord}
                handleChange={handleChange}
                handleKeyDown={handleKeyDown}
                possibleWords={possibleWords}
                correctWords={correctWords}
                percentage={percentage}
                volume={volume}
              />
            )}
            <GameSound />
          </div>
        </>
      )}
    </>
  );
}
