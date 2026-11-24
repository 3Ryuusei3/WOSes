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
import useRealtimeConnection from "../hooks/useRealtimeConnection";

import useGameStore from "../store/useGameStore";

import levelPassedSound from "../assets/win.mp3";

import { LEVELS_TO_ADVANCE } from "../constant";
import PlayersPanel from "../atoms/PlayersPanel";
import { startRound } from "../services/multiplayer";
import { showToast } from "../atoms/Toast";
import { primeMobileKeyboard } from "../utils/mobileKeyboard";
import useMobileUserAgent from "../hooks/useMobileUserAgent";

export default function GameLobby() {
  const {
    playerName,
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
    roomCode,
    randomWord,
    numberOfRounds,
    numberOfPerfectRounds,
    volume,
    dailyChallengeOriginalDifficulty,
  } = useGameStore();

  const isPlayer = players === "multi" && role === "player";
  const isMobile = useMobileUserAgent();

  const { t } = useTranslation();

  const [canAdvance, setCanAdvance] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState("");
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

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

  const {
    status: connectionStatus,
    syncNow,
    isSyncing,
  } = useRealtimeConnection();

  const showReconnectButton = isPlayer;

  const handleAdvance = useCallback(async () => {
    if (!canAdvance || isAdvancing) return;

    if (players === "multi" && role === "host" && roomCode && randomWord) {
      setIsAdvancing(true);
      try {
        // gameTime ya incluye los segundos ganados/perdidos de esta ronda
        const { gameTime: duration } = useGameStore.getState();
        const { error } = await startRound(roomCode, randomWord, duration);

        if (error) {
          showToast(
            "Error al avanzar al siguiente nivel: " + error.message,
            "error",
          );
          console.error("Error advancing to next round:", error);
          return;
        }

        setMode("loading");
      } catch (err) {
        console.error("Unexpected error advancing round:", err);
        showToast("Error inesperado al avanzar de nivel", "error");
      } finally {
        setIsAdvancing(false);
      }
    } else {
      // Same tap opens the keyboard on iOS (see primeMobileKeyboard)
      primeMobileKeyboard();
      setMode("loading");
    }
  }, [canAdvance, isAdvancing, players, role, roomCode, randomWord, setMode]);

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

  const actions = (
    <div className="h-section gap-xs f-jc-c mb-sm screen-actions">
      <button
        onClick={handleAdvance}
        disabled={!canAdvance || isAdvancing}
        className={!canAdvance || isAdvancing ? "btn button-disabled" : "btn"}
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
  );

  return (
    <>
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
        <div className="game__summary">
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
          <WordListDisplay lastLevelWords={lastLevelWords} columns={3} />
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
          <h3
            dangerouslySetInnerHTML={{ __html: t("lobby.perfectBonus") }}
          ></h3>
        )}
        {levelsToAdvance === LEVELS_TO_ADVANCE.THREE_STAR && (
          <h3
            dangerouslySetInnerHTML={{ __html: t("lobby.threeStarBonus") }}
          ></h3>
        )}
        {!isMobile && actions}
        <GameSound />
        <HelpButton onClick={() => setIsFeedbackModalOpen(true)} />
        <WordFeedbackModal
          isOpen={isFeedbackModalOpen}
          setModalOpen={setIsFeedbackModalOpen}
          lastLevelWords={lastLevelWords}
          difficulty={gameDifficulty}
          roomName={playerName}
        />
      </div>
      {/* Mobile: outside the panel, stuck to the bottom of the screen */}
      {isMobile && actions}
    </>
  );
}
