import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import GameSound from "../atoms/GameSound";
import DifficultyTag from "../atoms/DifficultyTag";
import MechanicsModal from "../atoms/MechanicsModal";
import WordListDisplay from "../atoms/WordListDisplay";
import WordFeedbackModal from "../atoms/WordFeedbackModal";
import HelpButton from "../atoms/HelpButton";
import LobbyStatsContainer from "../atoms/LobbyStatsContainer";
import NextChallengesSection from "../atoms/NextChallengesSection";
import ReconnectButton from "../atoms/ReconnectButton";

import useRemoveSeconds from "../hooks/useRemoveSeconds";
import useRandomWords from "../hooks/useRandomWords";
import useSetMechanics from "../hooks/useSetMechanics";
import useWindowSize from "../hooks/useWindowSize";
import useRoomStateSync from "../hooks/useRoomStateSync";
import useRealtimeConnection from "../hooks/useRealtimeConnection";

import useGameStore from "../store/useGameStore";

import levelPassedSound from "../assets/win.mp3";

import { LEVELS_TO_ADVANCE } from "../constant";
import PlayersPanel from "../atoms/PlayersPanel";
import {
  subscribeToRoom,
  startRoomWithWord,
  seedRoundWords,
} from "../services/multiplayer";
import useLanguageWords from "../hooks/useLanguageWords";
import { showToast } from "../atoms/Toast";
import Difficulty from "../types/Difficulty";
import { countLetters, canFormWord } from "../utils";

export default function GameLobby() {
  const {
    setMode,
    totalPoints,
    level,
    lastRoundPoints,
    levelsToAdvance,
    lastLevelWords,
    gameTime,
    gameMechanics,
    gameDifficulty,
    players,
    role,
    roomId,
    roomCode,
    randomWord,
    setRandomWord,
    setPossibleWords,
    setHiddenLetterIndex,
    numberOfRounds,
    numberOfPerfectRounds,
    volume,
    setGameDifficulty,
    dailyChallengeOriginalDifficulty,
  } = useGameStore();

  const { words } = useLanguageWords(gameDifficulty);

  const isPlayer = players === "multi" && role === "player";

  const { columns } = useWindowSize();
  const { t } = useTranslation();

  const [canAdvance, setCanAdvance] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState("");
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seededRef = useRef<boolean>(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(levelPassedSound);
      audioRef.current.volume = volume;
      audioRef.current.play().catch(() => {});
    }

    const timer = setTimeout(() => {
      setCanAdvance(true);
      containerRef.current?.focus();
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [volume]);

  useEffect(() => {
    seededRef.current = false;
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleMechanicClick = (mechanicKey: string) => {
    setSelectedMechanic(mechanicKey);
    setIsModalOpen(true);
  };

  // Solo generar mecánicas y palabras aleatorias si NO es daily challenge
  // Para daily challenge, estos valores ya están establecidos
  useSetMechanics(gameMechanics, level, gameDifficulty !== "daily");
  useRandomWords(gameDifficulty);
  const secondsToRemove = useRemoveSeconds();

  const handleStateSync = useCallback(
    (newState: {
      state?: string;
      current_word?: string;
      difficulty?: string;
    }) => {
      if (newState.difficulty) {
        setGameDifficulty(newState.difficulty as Difficulty);
      }

      if (
        newState.current_word &&
        (newState.state === "loading" || newState.state === "game")
      ) {
        setRandomWord(newState.current_word);
        const lettersCount = countLetters(newState.current_word);
        const filteredWords = (words || []).filter(
          (word) => word.length >= 4 && word.length <= 9,
        );
        const possible = filteredWords.filter((w) =>
          canFormWord(countLetters(w), lettersCount),
        );
        possible.sort((a, b) => a.length - b.length || a.localeCompare(b));
        setPossibleWords(possible);
        setHiddenLetterIndex(
          Math.floor(Math.random() * newState.current_word.length),
        );
      }

      if (newState.state === "loading") {
        setMode("loading");
      } else if (newState.state === "game") {
        setMode("game");
      } else if (newState.state === "lost") {
        setMode("lost");
      }
    },
    [
      words,
      setGameDifficulty,
      setRandomWord,
      setPossibleWords,
      setHiddenLetterIndex,
      setMode,
    ],
  );

  const { syncNow, isSyncing } = useRoomStateSync(roomId, handleStateSync);

  // Detectar estado de conexión y auto-sincronizar al reconectar
  const { status: connectionStatus } = useRealtimeConnection({
    onReconnect: () => {
      if (isPlayer) {
        syncNow();
      }
    },
  });

  const showReconnectButton = isPlayer;

  const handleAdvance = useCallback(async () => {
    if (!canAdvance) return;

    if (players === "multi" && role === "host" && roomCode && randomWord) {
      try {
        const { error } = await startRoomWithWord(roomCode, randomWord);

        if (error) {
          showToast(
            "Error al avanzar al siguiente nivel: " + error.message,
            "error",
          );
          console.error("Error advancing to next round:", error);
          return;
        }

        let seedingSuccess = false;
        try {
          const wordCount = countLetters(randomWord);
          const filteredWords = (words || []).filter(
            (word) => word.length >= 4 && word.length <= 9,
          );
          const possibleWordsList = filteredWords.filter((w) =>
            canFormWord(countLetters(w), wordCount),
          );
          possibleWordsList.sort(
            (a, b) => a.length - b.length || a.localeCompare(b),
          );

          const seedResult = await seedRoundWords(roomCode, possibleWordsList);
          seedingSuccess = !seedResult.error;

          if (seedResult.error) {
            console.error("Error seeding words in lobby:", seedResult.error);
            showToast(
              "Advertencia: algunas palabras podrían no sincronizarse",
              "warning",
              3000,
            );
          }
        } catch (err) {
          console.error("Error seeding words in lobby:", err);
          showToast(
            "Advertencia: problema al sincronizar palabras",
            "warning",
            3000,
          );
        }

        if (seedingSuccess) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        setMode("loading");
      } catch (err) {
        console.error("Unexpected error advancing round:", err);
        showToast("Error inesperado al avanzar de nivel", "error");
      }
    } else {
      setMode("loading");
    }
  }, [canAdvance, players, role, roomCode, randomWord, setMode, words]);

  useEffect(() => {
    if (!roomId) return;
    const channel = subscribeToRoom(roomId, (payload: any) => {
      const newRoom = payload.new as any;
      const newState = newRoom?.state;
      const currentWord = newRoom?.current_word as string | null;

      if (newState === "lobby") {
        return;
      }

      if (currentWord && (newState === "loading" || newState === "game")) {
        setRandomWord(currentWord);
        const lettersCount = countLetters(currentWord);
        const filteredWords = (words || []).filter(
          (word) => word.length >= 4 && word.length <= 9,
        );
        const possible = filteredWords.filter((w) =>
          canFormWord(countLetters(w), lettersCount),
        );
        possible.sort((a, b) => a.length - b.length || a.localeCompare(b));
        setPossibleWords(possible);
        setHiddenLetterIndex(Math.floor(Math.random() * currentWord.length));
      }

      if (newState === "loading") setMode("loading");
      else if (newState === "game") setMode("game");
      else if (newState === "lost") setMode("lost");
    });
    return () => {
      channel.unsubscribe();
    };
  }, [
    roomId,
    setMode,
    setRandomWord,
    setPossibleWords,
    setHiddenLetterIndex,
    words,
  ]);

  if (players === "multi" && role === "player") {
    return (
      <div className="game__container f-jc-c">
        <PlayersPanel lastLevelWords={lastLevelWords} />
        <div className="h-section gap-xs f-jc-c mb-sm">
          <ReconnectButton
            onClick={syncNow}
            disabled={isSyncing}
            connectionStatus={connectionStatus}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="game__container f-jc-c"
      onKeyDown={(e) => e.key === "Enter" && handleAdvance()}
      tabIndex={0}
      role="button"
      aria-label="Avanzar al siguiente nivel"
    >
      <div className="difficulty-tag">
        <DifficultyTag
          gameDifficulty={gameDifficulty}
          dailyChallengeOriginalDifficulty={dailyChallengeOriginalDifficulty}
        />
      </div>
      {levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR ? (
        <h1 className="won">{t("lobby.perfect")}</h1>
      ) : (
        <h1 className="highlight">{t("lobby.congratulations")}</h1>
      )}
      <h3>
        {t("lobby.youAdvanced")}
        {levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR ? (
          <span className="won"> {levelsToAdvance} </span>
        ) : (
          <span className="highlight"> {levelsToAdvance} </span>
        )}
        {levelsToAdvance > 1 ? t("lobby.levels") : t("lobby.level")}
      </h3>
      <div className="h-section gap-lg mx-auto">
        <LobbyStatsContainer
          level={level}
          levelsToAdvance={levelsToAdvance}
          lastRoundPoints={lastRoundPoints}
          totalPoints={totalPoints}
          gameTime={gameTime}
          numberOfRounds={numberOfRounds}
          numberOfPerfectRounds={numberOfPerfectRounds}
          secondsToRemove={secondsToRemove}
        />
        <WordListDisplay lastLevelWords={lastLevelWords} columns={columns} />
        {gameMechanics && (
          <>
            <NextChallengesSection
              gameMechanics={gameMechanics}
              canAdvance={canAdvance}
              onMechanicClick={handleMechanicClick}
            />
            <MechanicsModal
              isOpen={isModalOpen}
              setModalOpen={setIsModalOpen}
              mechanicType={selectedMechanic}
            />
          </>
        )}
      </div>
      {secondsToRemove > 0 && (
        <h3
          dangerouslySetInnerHTML={{
            __html: t("lobby.lessTime", { seconds: secondsToRemove }),
          }}
        ></h3>
      )}
      {levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR && (
        <h3 dangerouslySetInnerHTML={{ __html: t("lobby.perfectBonus") }}></h3>
      )}
      {levelsToAdvance === LEVELS_TO_ADVANCE.THREE_STAR && (
        <h3
          dangerouslySetInnerHTML={{ __html: t("lobby.threeStarBonus") }}
        ></h3>
      )}
      <div className="h-section gap-xs f-jc-c mb-sm">
        <button
          onClick={handleAdvance}
          disabled={!canAdvance}
          className={!canAdvance ? "button-disabled" : ""}
        >
          {t("lobby.playLevel", { level })}
        </button>
        {showReconnectButton && (
          <ReconnectButton
            onClick={syncNow}
            disabled={isSyncing}
            connectionStatus={connectionStatus}
          />
        )}
      </div>
      <GameSound />
      <HelpButton onClick={() => setIsFeedbackModalOpen(true)} />
      <WordFeedbackModal
        isOpen={isFeedbackModalOpen}
        setModalOpen={setIsFeedbackModalOpen}
        originalWord={randomWord}
        difficulty={gameDifficulty}
      />
    </div>
  );
}
