import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TopScores from "../atoms/TopScores";
import SegmentedTabs from "../atoms/SegmentedTabs";
import RoomRankingPanel from "../atoms/RoomRankingPanel";
import useBroadcastSummary from "../hooks/useBroadcastSummary";
import useLastWordsWithNames from "../hooks/useLastWordsWithNames";
import useRequestSummary from "../hooks/useRequestSummary";
import useGroupName from "../hooks/useGroupName";
import { useRoomRealtimeStore } from "../realtime/roomRealtime";
import GameSound from "../atoms/GameSound";
import FullscreenButton from "../atoms/FullscreenButton";
import DifficultyTag from "../atoms/DifficultyTag";
import WordListDisplay from "../atoms/WordListDisplay";
import StatBox from "../atoms/StatBox";
import WordFeedbackModal from "../atoms/WordFeedbackModal";
import HelpButton from "../atoms/HelpButton";
import BackHomeButton from "../atoms/BackHomeButton";

import useGameStore from "../store/useGameStore";
import useMobileLayout from "../hooks/useMobileLayout";
import useLanguageWords from "../hooks/useLanguageWords";
import useRealtimeConnection from "../hooks/useRealtimeConnection";
import useRoomManager from "../hooks/useRoomManager";

import gameOverSound from "../assets/gameover.mp3";
import { START_TIME } from "../constant";
import { showToast } from "../atoms/Toast";
import { saveRoomSession } from "../realtime/roomSession";
import { countLetters, canFormWord } from "../utils";
import { playSound } from "../utils/sound";

export default function GameLost() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    setMode,
    totalPoints,
    setTotalPoints,
    level,
    setLevel,
    playerName,
    highestScore,
    setHighestScore,
    lastLevelWords,
    setGameMechanics,
    setGameTime,
    setLevelsToAdvance,
    players,
    role,
    numberOfRounds,
    setNumberOfRounds,
    numberOfPerfectRounds,
    setNumberOfPerfectRounds,
    gameDifficulty,
    volume,
    roomCode,
    setRoomCode,
    setRoomId,
    setPlayerId,
    setRandomWord,
    setPossibleWords,
    setHiddenLetterIndex,
    setPreviousRoundsWords,
    currentChallengeNumber,
    dailyChallengeOriginalDifficulty,
    gameTime,
  } = useGameStore();

  const isDailyChallenge = gameDifficulty === "daily";
  const isDailyChallengeCompleted =
    isDailyChallenge &&
    lastLevelWords.length > 0 &&
    lastLevelWords.every((word) => word.guessed);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobileUa = useMobileLayout();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  // Single player on mobile: ranking is a tab of the screen instead of a
  // modal. Multiplayer (any device): summary / room ranking / global top.
  // Phones also get the last level's words in a tab of their own.
  const [mobileTab, setMobileTab] = useState<"summary" | "words" | "ranking">(
    "summary",
  );
  const [multiTab, setMultiTab] = useState<
    "summary" | "words" | "ranking" | "top"
  >("summary");
  const { words } = useLanguageWords(gameDifficulty);
  const { forceReconnect, isConnected } = useRealtimeConnection();
  const roomManager = useRoomManager();
  const isMulti = players === "multi";
  const isPlayer = isMulti && role === "player";

  // The host shares the final numbers; players show what it sends
  const roundId = useRoomRealtimeStore((s) => s.round?.id ?? null);
  const rtSummary = useRoomRealtimeStore((s) => s.summary);
  useBroadcastSummary(
    isMulti && role === "host" && roundId
      ? {
          round_id: roundId,
          kind: "lost",
          level,
          levels_to_advance: 0,
          last_round_points: 0,
          total_points: totalPoints,
          game_time: 0,
          seconds_to_remove: 0,
          number_of_rounds: numberOfRounds,
          perfect_rounds: numberOfPerfectRounds,
          mechanics: null,
        }
      : null,
  );
  const playerSummary =
    isPlayer && rtSummary?.kind === "lost" && rtSummary.round_id === roundId
      ? rtSummary
      : null;
  const stats = isPlayer
    ? playerSummary && {
        level: playerSummary.level,
        totalPoints: playerSummary.total_points,
        numberOfRounds: playerSummary.number_of_rounds,
        numberOfPerfectRounds: playerSummary.perfect_rounds,
      }
    : { level, totalPoints, numberOfRounds, numberOfPerfectRounds };
  const namedLastWords = useLastWordsWithNames(lastLevelWords, isMulti);
  useRequestSummary(isPlayer && !playerSummary);
  const groupName = useGroupName();

  // Hook para resetear el estado del juego
  const resetGameState = () => {
    setTotalPoints(0);
    setLevel(1);
    setGameMechanics({
      fake: false,
      hidden: false,
      first: false,
      dark: false,
      still: false,
      mirrored: false,
    });
    setGameTime(START_TIME);
    setNumberOfPerfectRounds(0);
    setNumberOfRounds(0);
    setLevelsToAdvance(0);
    setPreviousRoundsWords([]);
  };

  const handleExit = () => {
    if (players === "multi") {
      if (role === "host") {
        setMode("start");
        navigate("/game");
      } else {
        setMode("room");
        navigate(`/game?id=${roomCode}`);
      }
    } else {
      navigate("/game");
    }
  };

  const generateNewWord = () => {
    if (!words || words.length === 0) return null;

    const filteredWords = words.filter(
      (word: any) => word.length >= 4 && word.length <= 9,
    );
    const randomWord =
      filteredWords[Math.floor(Math.random() * filteredWords.length)];

    const lettersCount = countLetters(randomWord);
    const possible = filteredWords.filter((w: any) =>
      canFormWord(countLetters(w), lettersCount),
    );
    possible.sort(
      (a: any, b: any) => a.length - b.length || a.localeCompare(b),
    );

    return {
      word: randomWord,
      possibleWords: possible,
      hiddenIndex: Math.floor(Math.random() * randomWord.length),
    };
  };

  const handlePlayAgain = async () => {
    if (players === "multi" && role === "host") {
      setIsCreatingRoom(true);
      try {
        const newWordData = generateNewWord();
        if (!newWordData) {
          showToast("Error al generar la palabra", "error");
          setIsCreatingRoom(false);
          return;
        }

        setRandomWord(newWordData.word);
        setPossibleWords(newWordData.possibleWords);
        setHiddenLetterIndex(newWordData.hiddenIndex);

        // Usar RoomManager para crear nueva sala
        const newRoomCode = roomManager.generateRoomCode();
        const { hostPlays, groupName } = useGameStore.getState();
        const result = await roomManager.createNewRoomForRematch(
          roomCode,
          newRoomCode,
          playerName,
          gameDifficulty,
          hostPlays ? groupName : undefined,
        );

        if (result.error || !result.data) {
          showToast("Error al crear la nueva sala", "error");
          setIsCreatingRoom(false);
          return;
        }

        setRoomCode(result.data.roomCode);
        setRoomId(result.data.roomId);
        setPlayerId(result.data.playerId);
        saveRoomSession({
          code: result.data.roomCode,
          roomId: result.data.roomId,
          playerId: result.data.playerId,
          name: playerName,
          role: "host",
        });

        resetGameState();

        navigate(`/game?id=${newRoomCode}`);
        setMode("room");
      } catch (err) {
        showToast("Error al crear la nueva sala", "error");
        setIsCreatingRoom(false);
      }
    } else if (players === "multi" && role === "player") {
      return;
    } else {
      setMode("start");
      resetGameState();
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(gameOverSound);
      audioRef.current.volume = volume;

      audioRef.current.addEventListener(
        "canplaythrough",
        () => {
          playSound(audioRef.current);
        },
        { once: true },
      );
    }

    if (totalPoints > highestScore.score) {
      setHighestScore({
        name: playerName,
        score: totalPoints,
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [totalPoints, highestScore.score, playerName, setHighestScore]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const ranking = isDailyChallenge ? (
    <TopScores
      hasTooltip
      difficulty="daily"
      challengeNumber={currentChallengeNumber!}
    />
  ) : (
    <TopScores hasTooltip difficulty={gameDifficulty} />
  );

  const showSummary = isMulti
    ? multiTab === "summary"
    : !isMobileUa || mobileTab === "summary";

  const actions = isPlayer ? (
    <div className="h-section gap-xs f-jc-c mb-sm screen-actions">
      <div className="score__container--box dark">
        <p className="txt-center">{t("game.waitingForHost")}</p>
      </div>
      <button className="btn btn--sm btn--lose" onClick={handleExit}>
        {t("game.exit")}
      </button>
      {!isConnected && (
        <button onClick={forceReconnect} className="btn btn--sm">
          {t("game.reconnect")}
        </button>
      )}
    </div>
  ) : (
    <div className="h-section gap-xs f-jc-c mb-sm screen-actions">
      {!isDailyChallenge && players === "multi" && (
        <button className="btn btn--sm btn--lose" onClick={handleExit}>
          {t("game.exit")}
        </button>
      )}
      <button
        className="btn"
        onClick={handlePlayAgain}
        disabled={!isDailyChallenge && isCreatingRoom}
      >
        {isDailyChallenge
          ? t("common.startNewGame")
          : isCreatingRoom
            ? t("game.creatingNewRoom")
            : t("common.playAgain")}
      </button>
    </div>
  );

  const reviewBlock = (isDailyChallenge ? (
            <div className="game__review">
              <div className="v-section">
                <StatBox
                  label={t("common.totalPoints")}
                  value={totalPoints}
                  size="sm"
                />
              </div>
              <div className="v-section">
                <StatBox
                  label={t("common.remainingTime")}
                  value={`${gameTime}s`}
                  size="sm"
                />
              </div>
            </div>
          ) : stats ? (
            <div
              className={`game__review ${isMulti ? "game__review--grid" : ""}`}
            >
              <div className="v-section">
                <StatBox
                  label={t("common.reachedLevel")}
                  value={stats.level}
                  size="sm"
                />
              </div>
              <div className="v-section">
                <StatBox
                  label={t("common.totalPoints")}
                  value={stats.totalPoints}
                  size="sm"
                />
              </div>
              <div className="v-section">
                <StatBox
                  label={t("common.numberOfRounds")}
                  value={stats.numberOfRounds}
                  size="sm"
                />
              </div>
              <div className="v-section">
                <StatBox
                  label={t("common.perfectRounds")}
                  value={stats.numberOfPerfectRounds}
                  size="sm"
                />
              </div>
            </div>
          ) : (
            <p className="txt-center unguessed">{t("lobby.loadingSummary")}</p>
          ));

  const wordsBlock = (
    <WordListDisplay
      lastLevelWords={namedLastWords}
      columns={3}
      playerName={isMulti ? playerName : undefined}
    />
  );

  return (
    <>
      <div className="game__container game__container--lost f-jc-c">
        <div className="difficulty-tag">
          <DifficultyTag
            gameDifficulty={gameDifficulty}
            dailyChallengeOriginalDifficulty={dailyChallengeOriginalDifficulty}
          />
        </div>
        {isDailyChallenge ? (
          <h1
            className={`screen-ribbon ${isDailyChallengeCompleted ? "screen-ribbon--green" : "screen-ribbon--pink"}`}
          >
            {isDailyChallengeCompleted
              ? t("dailyChallenge.completed")
              : t("dailyChallenge.lost")}
          </h1>
        ) : (
          <h1 className="screen-ribbon screen-ribbon--pink">{t("game.lost")}</h1>
        )}
        {isMulti ? (
          <SegmentedTabs
            tabs={[
              { key: "summary", label: t("common.summary") },
              ...(isMobileUa
                ? [{ key: "words" as const, label: t("common.lastLevel") }]
                : []),
              { key: "ranking", label: t("common.ranking") },
              { key: "top", label: t("common.globalTop") },
            ]}
            active={multiTab}
            onChange={setMultiTab}
          />
        ) : (
          isMobileUa && (
            <SegmentedTabs
              tabs={[
                { key: "summary", label: t("common.summary") },
                { key: "words", label: t("common.lastLevel") },
                { key: "ranking", label: t("common.ranking") },
              ]}
              active={mobileTab}
              onChange={setMobileTab}
            />
          )
        )}
        {showSummary && isMulti && (
          // Desktop: points and levels (2x2) on the left, words on the right.
          // Phones: the words have their own tab.
          <div className="lost-summary">
            {reviewBlock}
            {!isMobileUa && wordsBlock}
          </div>
        )}
        {showSummary && !isMulti && reviewBlock}
        {showSummary && !isMulti && !isMobileUa && (
          <div className="game__summary">
            <div className="v-section gap-md">{wordsBlock}</div>
            <div className="score__container--box pos-rel">{ranking}</div>
          </div>
        )}
        {isMobileUa &&
          (isMulti ? multiTab === "words" : mobileTab === "words") &&
          wordsBlock}
        {!isMulti && isMobileUa && mobileTab === "ranking" && (
          <div className="score__container--box dark w100 mobile-ranking">
            {ranking}
          </div>
        )}
        {isMulti && multiTab === "ranking" && (
          <div className="score__container--box dark w100 mobile-ranking multi-tab-panel">
            <RoomRankingPanel />
          </div>
        )}
        {isMulti && multiTab === "top" && (
          <div className="score__container--box dark w100 mobile-ranking multi-tab-panel">
            {stats && (
              <h4 className="txt-center highlight">
                {groupName && (
                  <>
                    <span className="won">{groupName}</span>
                    {" · "}
                  </>
                )}
                {t("common.reachedLevel")}{" "}
                <span className="won">{stats.level}</span>
                {" · "}
                <span className="won">{stats.totalPoints}</span>{" "}
                {t("common.points")}
              </h4>
            )}
            <TopScores
              hasTooltip
              difficulty={gameDifficulty}
              highlightCode={roomCode || undefined}
            />
          </div>
        )}
        {!isMobileUa && actions}
        {/* Top-right corner: "¿Falta algo?" next to the sound button */}
        {/* Mobile: top-left of the logo row, facing "¿Falta algo?" */}
        {isMobileUa && <BackHomeButton className="back-control--corner" />}
        <div className="panel-actions">
          {!isMobileUa && <BackHomeButton />}
          <HelpButton onClick={() => setIsFeedbackModalOpen(true)} />
          <FullscreenButton />
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
      {isMobileUa && actions}
    </>
  );
}
