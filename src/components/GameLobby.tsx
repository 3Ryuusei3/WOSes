import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import GameSound from "../atoms/GameSound";
import DifficultyTag from "../atoms/DifficultyTag";
import MechanicsModal from "../atoms/MechanicsModal";
import WordListDisplay from "../atoms/WordListDisplay";
import WordFeedbackModal from "../atoms/WordFeedbackModal";
import HelpButton from "../atoms/HelpButton";
import BackHomeButton from "../atoms/BackHomeButton";
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
import SegmentedTabs from "../atoms/SegmentedTabs";
import RoomRankingPanel from "../atoms/RoomRankingPanel";
import useBroadcastSummary from "../hooks/useBroadcastSummary";
import useLastWordsWithNames from "../hooks/useLastWordsWithNames";
import useRequestSummary from "../hooks/useRequestSummary";
import { useRoomRealtimeStore } from "../realtime/roomRealtime";
import { startRound } from "../services/multiplayer";
import { showToast } from "../atoms/Toast";
import { primeMobileKeyboard } from "../utils/mobileKeyboard";
import useMobileLayout from "../hooks/useMobileLayout";
import { playSound } from "../utils/sound";

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

  const isMulti = players === "multi";
  const isPlayer = isMulti && role === "player";
  const isMobile = useMobileLayout();
  // Multiplayer (any role, any screen): summary of the level / room ranking
  const [tab, setTab] = useState<"summary" | "ranking">("summary");
  const showSummary = !isMulti || tab === "summary";

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
      playSound(audioRef.current);
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

  // Only the host computes the level summary: it shares it with the room and
  // players show what it sends (until then, just the words)
  const roundId = useRoomRealtimeStore((s) => s.round?.id ?? null);
  const rtSummary = useRoomRealtimeStore((s) => s.summary);
  useBroadcastSummary(
    isMulti && role === "host" && roundId
      ? {
          round_id: roundId,
          kind: "lobby",
          level,
          levels_to_advance: levelsToAdvance,
          last_round_points: lastRoundPoints,
          total_points: totalPoints,
          game_time: gameTime,
          seconds_to_remove: secondsToRemove,
          number_of_rounds: numberOfRounds,
          perfect_rounds: numberOfPerfectRounds,
          mechanics: gameMechanics,
        }
      : null,
  );
  const playerSummary =
    isPlayer && rtSummary?.kind === "lobby" && rtSummary.round_id === roundId
      ? rtSummary
      : null;
  const view = isPlayer
    ? playerSummary && {
        level: playerSummary.level,
        levelsToAdvance: playerSummary.levels_to_advance,
        lastRoundPoints: playerSummary.last_round_points,
        totalPoints: playerSummary.total_points,
        gameTime: playerSummary.game_time,
        secondsToRemove: playerSummary.seconds_to_remove,
        numberOfRounds: playerSummary.number_of_rounds,
        numberOfPerfectRounds: playerSummary.perfect_rounds,
        mechanics: playerSummary.mechanics,
      }
    : {
        level,
        levelsToAdvance,
        lastRoundPoints,
        totalPoints,
        gameTime,
        secondsToRemove,
        numberOfRounds,
        numberOfPerfectRounds,
        mechanics: gameMechanics,
      };
  const words = useLastWordsWithNames(lastLevelWords, isMulti);
  useRequestSummary(isPlayer && !playerSummary);

  const {
    status: connectionStatus,
    syncNow,
    isSyncing,
  } = useRealtimeConnection();

  const showReconnectButton = isPlayer;

  const handleAdvance = useCallback(async () => {
    // Players wait for the host (Enter on the panel must not advance them)
    if (isPlayer || !canAdvance || isAdvancing) return;
    // Same tap opens the keyboard on iOS for the next round (see
    // primeMobileKeyboard); also for the host that plays
    primeMobileKeyboard();

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
      setMode("loading");
    }
  }, [
    canAdvance,
    isAdvancing,
    isPlayer,
    players,
    role,
    roomCode,
    randomWord,
    setMode,
  ]);

  const actions = (
    <div className="h-section gap-xs f-jc-c mb-sm screen-actions">
      {isPlayer ? (
        <div className="score__container--box dark">
          <p className="txt-center">{t("game.waitingForHost")}</p>
        </div>
      ) : (
        <button
          onClick={handleAdvance}
          disabled={!canAdvance || isAdvancing}
          className={!canAdvance || isAdvancing ? "btn button-disabled" : "btn"}
        >
          {t("lobby.playLevel", { level })}
        </button>
      )}
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
        {view?.levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR ? (
          <h1 className="won">{t("lobby.perfect")}</h1>
        ) : (
          <h1 className="highlight">{t("lobby.congratulations")}</h1>
        )}
        {isMulti && (
          <SegmentedTabs
            tabs={[
              { key: "summary", label: t("common.summary") },
              { key: "ranking", label: t("common.ranking") },
            ]}
            active={tab}
            onChange={setTab}
          />
        )}
        {isMulti && tab === "ranking" && (
          <div className="score__container--box dark w100 mobile-ranking multi-tab-panel">
            <RoomRankingPanel />
          </div>
        )}
        {showSummary && view && (
          <h3>
            {t("lobby.youAdvanced")}
            {view.levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR ? (
              <span className="won"> {view.levelsToAdvance} </span>
            ) : (
              <span className="highlight"> {view.levelsToAdvance} </span>
            )}
            {view.levelsToAdvance > 1 ? t("lobby.levels") : t("lobby.level")}
          </h3>
        )}
        {showSummary && !view && (
          <p className="txt-center unguessed">{t("lobby.loadingSummary")}</p>
        )}
        {showSummary && (
          <div className="game__summary">
            {view && (
              <LobbyStatsContainer
                level={view.level}
                levelsToAdvance={view.levelsToAdvance}
                lastRoundPoints={view.lastRoundPoints}
                totalPoints={view.totalPoints}
                gameTime={view.gameTime}
                numberOfRounds={view.numberOfRounds}
                numberOfPerfectRounds={view.numberOfPerfectRounds}
                secondsToRemove={view.secondsToRemove}
              />
            )}
            <WordListDisplay
              lastLevelWords={words}
              columns={3}
              playerName={isMulti ? playerName : undefined}
            />
            {view?.mechanics && (
              <>
                <NextChallengesSection
                  gameMechanics={view.mechanics}
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
        )}
        {showSummary && view && view.secondsToRemove > 0 && (
          <h3
            dangerouslySetInnerHTML={{
              __html: t("lobby.lessTime", { seconds: view.secondsToRemove }),
            }}
          ></h3>
        )}
        {showSummary &&
          view?.levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR && (
            <h3
              dangerouslySetInnerHTML={{ __html: t("lobby.perfectBonus") }}
            ></h3>
          )}
        {showSummary &&
          view?.levelsToAdvance === LEVELS_TO_ADVANCE.THREE_STAR && (
            <h3
              dangerouslySetInnerHTML={{ __html: t("lobby.threeStarBonus") }}
            ></h3>
          )}
        {!isMobile && actions}
        {/* Top-right corner: "¿Falta algo?" next to the sound button */}
        {/* Mobile: top-left of the logo row, facing "¿Falta algo?" */}
        {isMobile && <BackHomeButton className="back-control--corner" />}
        <div className="panel-actions">
          {!isMobile && <BackHomeButton />}
          <HelpButton onClick={() => setIsFeedbackModalOpen(true)} />
          <GameSound />
        </div>
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
