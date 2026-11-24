import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import TopScores from "../atoms/TopScores";
import HowToPlayModal from "../atoms/HowToPlayModal";
import DifficultySelector from "../atoms/DifficultySelector";

import useRandomWords from "../hooks/useRandomWords";
import useBackgroundAudio from "../hooks/useBackgroundAudio";
import useSetMechanics from "../hooks/useSetMechanics";
import useDailyChallenge from "../hooks/useDailyChallenge";
import useRoomManager from "../hooks/useRoomManager";
import useMobileLayout from "../hooks/useMobileLayout";

import useGameStore from "../store/useGameStore";
import SegmentedTabs from "../atoms/SegmentedTabs";
import { showToast } from "../atoms/Toast";
import { primeMobileKeyboard } from "../utils/mobileKeyboard";
import GameSound from "../atoms/GameSound";
import PlayersSelector, { type StartMode } from "../atoms/PlayersSelector";
import QrScannerModal from "../atoms/QrScannerModal";
import UserBadge from "../atoms/UserBadge";
import HelpButton from "../atoms/HelpButton";
import WordFeedbackModal from "../atoms/WordFeedbackModal";
import useJoinRoom from "../hooks/useJoinRoom";
import { saveRoomSession, unmarkRoomLeft } from "../realtime/roomSession";
import { isInstalledPwa } from "../utils/pwa";

import Difficulty from "../types/Difficulty";
import { START_TIME } from "../constant";

export default function GameStart() {
  const {
    playerName,
    setNameModalOpen,
    hostPlays,
    setHostPlays,
    setMode,
    gameMechanics,
    level,
    setLevel,
    setGameDifficulty,
    gameDifficulty,
    volume,
    players,
    setPlayers,
    setRoomCode,
    setRole,
    setRoomId,
    setPlayerId,
    setTotalPoints,
    setGameMechanics,
    setGameTime,
    setNumberOfPerfectRounds,
    setNumberOfRounds,
    setLevelsToAdvance,
    setPreviousRoundsWords,
    setDailyChallengeOriginalDifficulty,
  } = useGameStore();
  const [howToPlayModal, setHowToPlayModal] = useState(false);
  // Mobile: ranking is a tab of the screen instead of a modal
  // "Unirse": join an existing room with its code (or its QR, in the app)
  const [joinMode, setJoinMode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { join, joining, joinError, setJoinError } = useJoinRoom();
  // Installed app: the phone's camera app would open the QR link in the
  // browser, outside the app, so we offer an in-app scanner instead
  const [canScanQr] = useState(isInstalledPwa);
  const startMode: StartMode = joinMode
    ? "join"
    : players === "multi"
      ? "multi"
      : "single";

  // Mobile: the ranking is its own view (opened with a button, "Volver" to
  // come back) instead of a modal
  const [mobileView, setMobileView] = useState<"play" | "ranking">("play");
  // Mobile ranking tab: its own difficulty (doesn't change the game's).
  // null = follow the difficulty selected to play.
  const [rankingTabDifficulty, setRankingTabDifficulty] =
    useState<Difficulty | null>(null);
  const [isDailyChallengeSelected, setIsDailyChallengeSelected] =
    useState(false);
  const isMobileUa = useMobileLayout();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  void searchParams;
  const roomManager = useRoomManager();

  // Función para resetear el estado del juego
  const resetGameState = () => {
    setLevel(1);
    setTotalPoints(0);
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

  const {
    dailyChallenge,
    loading: loadingChallenge,
    alreadyPlayed,
    loadDailyChallenge,
    startDailyChallenge,
  } = useDailyChallenge();

  useEffect(() => {
    if (gameDifficulty === "daily" && !dailyChallenge && !loadingChallenge) {
      loadDailyChallenge();
      setIsDailyChallengeSelected(true);
    }
  }, [gameDifficulty, dailyChallenge, loadingChallenge, loadDailyChallenge]);

  useSetMechanics(gameMechanics, level, gameDifficulty !== "daily");
  useRandomWords(gameDifficulty, players === "multi");

  useBackgroundAudio(volume);

  // The name is asked once (header user button to change it)
  const hasValidName = roomManager.validatePlayerName(playerName).valid;
  useEffect(() => {
    if (!hasValidName) setNameModalOpen(true);
  }, [hasValidName, setNameModalOpen]);

  const handleSubmit = async () => {
    if (!hasValidName) {
      setNameModalOpen(true);
      return;
    }

    if (isDailyChallengeSelected && dailyChallenge) {
      primeMobileKeyboard();
      startDailyChallenge();
      return;
    }

    if (players === "single") {
      // Same tap opens the keyboard on iOS (see primeMobileKeyboard)
      primeMobileKeyboard();
      setMode("loading");
      setDailyChallengeOriginalDifficulty(null);
    } else {
      resetGameState();

      const roomCode = roomManager.generateRoomCode();
      setRoomCode(roomCode);

      const result = await roomManager.createRoom(
        roomCode,
        playerName,
        gameDifficulty,
      );

      if (!result.error && result.data) {
        setRole("host");
        setRoomId(result.data.roomId);
        setPlayerId(result.data.playerId);
        // Remembered so a reload brings the host back to its room
        saveRoomSession({
          code: roomCode,
          roomId: result.data.roomId,
          playerId: result.data.playerId,
          name: playerName,
          role: "host",
        });
        unmarkRoomLeft(roomCode);
        navigate(`/game?id=${roomCode}`);
      } else {
        showToast(t("gameStart.createError"), "error");
      }
    }
  };

  const handleModeChange = (mode: StartMode) => {
    setJoinMode(mode === "join");
    setPlayers(mode === "multi" ? "multi" : "single");
    setCodeError(false);
    setJoinError(null);
  };

  const joinWithCode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    const codeValid = roomManager.validateRoomCode(code);
    setCodeError(!codeValid);
    if (!codeValid) return;
    if (!hasValidName) {
      setNameModalOpen(true);
      return;
    }

    const joined = await join(code, playerName);
    // The room screen takes it from here (identity is saved by useJoinRoom)
    if (joined) navigate(`/game?id=${code}`);
  };

  const handleScannedCode = useCallback(
    (code: string) => {
      setScannerOpen(false);
      setJoinCode(code);
      void joinWithCode(code);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerName],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (joinMode) void joinWithCode(joinCode);
      else handleSubmit();
    }
  };

  const getButtonText = () => {
    if (isDailyChallengeSelected) {
      return t("gameStart.startDaily");
    }
    const difficultyLabel = t(`difficulties.${gameDifficulty}`);
    if (players === "multi") {
      return t("common.startMultiplayer", { difficulty: difficultyLabel });
    } else {
      return t("common.start", { difficulty: difficultyLabel });
    }
  };

  const handleDailyChallenge = async () => {
    if (!hasValidName) {
      setNameModalOpen(true);
      return;
    }

    await loadDailyChallenge();
    setIsDailyChallengeSelected(true);
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setGameDifficulty(difficulty);
    setIsDailyChallengeSelected(false);
  };

  const rankingDifficulty =
    isDailyChallengeSelected || gameDifficulty === "daily"
      ? "daily"
      : gameDifficulty;

  // Ranking shown: on mobile the one picked in its tabs (doesn't change the
  // game's difficulty); otherwise / until then, the difficulty selected to play
  const shownRankingDifficulty =
    (isMobileUa && rankingTabDifficulty) || rankingDifficulty;

  const handleRankingDifficulty = (difficulty: Difficulty) => {
    setRankingTabDifficulty(difficulty);
    // The daily ranking needs today's challenge number
    if (difficulty === "daily" && !dailyChallenge && !loadingChallenge) {
      void loadDailyChallenge();
    }
  };

  const rankingPanel = (
    <>
      {/* Mobile only: on desktop the ranking follows the selected difficulty */}
      {isMobileUa && (
        <SegmentedTabs
          tabs={(["easy", "medium", "hard", "daily"] as Difficulty[]).map(
            (d) => ({
              key: d,
              label: t(`difficulties.${d}`),
              // Same colors as the difficulty buttons
              className: `segmented-tabs__tab--${d}`,
            }),
          )}
          active={shownRankingDifficulty}
          onChange={handleRankingDifficulty}
          size="sm"
        />
      )}
      {alreadyPlayed && shownRankingDifficulty === "daily" && (
        <p className="daily-retry-note">{t("dailyChallenge.retryNote")}</p>
      )}
      {shownRankingDifficulty === "daily" && !dailyChallenge ? (
        <p className="txt-center">{t("common.loading")}</p>
      ) : (
        <TopScores
          difficulty={shownRankingDifficulty}
          challengeNumber={
            shownRankingDifficulty === "daily"
              ? dailyChallenge?.challenge_number
              : undefined
          }
        />
      )}
    </>
  );

  const startButton = joinMode ? (
    <button
      className="btn"
      onClick={() => void joinWithCode(joinCode)}
      disabled={joining}
    >
      {t("game.joinRoom")}
    </button>
  ) : (
    <button
      className={`btn ${
        isDailyChallengeSelected
          ? "btn--daily"
          : gameDifficulty === "easy"
            ? "btn--win"
            : gameDifficulty === "hard"
              ? "btn--lose"
              : ""
      }`}
      onClick={handleSubmit}
    >
      {getButtonText()}
    </button>
  );

  const showForm = !isMobileUa || mobileView === "play";

  return (
    <>
      <div className="game__container f-jc-c pos-rel">
        <div className="h-section gap-lg">
          {showForm && (
            <div className="home__container">
              <h2 className="highlight">{t("gameStart.nameAndDifficulty")}</h2>
              <PlayersSelector
                mode={startMode}
                onModeChange={handleModeChange}
                onDifficultyChange={handleDifficultyChange}
              />
              {/* Each mode's options, stacked in the same space: the box keeps
                  the tallest one's height, so it doesn't jump when switching */}
              <div className="mode-panels">
                <div
                  className={`mode-panel ${startMode === "single" ? "is-active" : ""}`}
                  aria-hidden={startMode !== "single"}
                >
                  <DifficultySelector
                    gameDifficulty={gameDifficulty}
                    onDifficultyChange={handleDifficultyChange}
                    showDailyChallenge
                    onDailyChallengeClick={handleDailyChallenge}
                    loadingDaily={loadingChallenge}
                    isDailyChallengeSelected={isDailyChallengeSelected}
                  />
                </div>
                <div
                  className={`mode-panel ${startMode === "multi" ? "is-active" : ""}`}
                  aria-hidden={startMode !== "multi"}
                >
                  <DifficultySelector
                    gameDifficulty={gameDifficulty}
                    onDifficultyChange={handleDifficultyChange}
                  />
                  {/* Shared main screen, or everyone (host included) plays
                      on their own phone */}
                  <label className="switch-row">
                    <input
                      type="checkbox"
                      checked={hostPlays}
                      onChange={(e) => setHostPlays(e.target.checked)}
                    />
                    <span className="switch-row__switch" aria-hidden="true" />
                    <span className="switch-row__text">
                      {/* Both texts stacked (only one visible): the row keeps
                          the same height when toggling */}
                      <span
                        className={`switch-row__variant ${hostPlays ? "" : "is-active"}`}
                        aria-hidden={hostPlays}
                      >
                        <span>{t("gameStart.mainScreen")}</span>
                        <small>{t("gameStart.mainScreenHint")}</small>
                      </span>
                      <span
                        className={`switch-row__variant ${hostPlays ? "is-active" : ""}`}
                        aria-hidden={!hostPlays}
                      >
                        <span>{t("gameStart.noMainScreen")}</span>
                        <small>{t("gameStart.noMainScreenHint")}</small>
                      </span>
                    </span>
                  </label>
                </div>
                {/* Joining: the room already has its difficulty */}
                <div
                  className={`mode-panel ${startMode === "join" ? "is-active" : ""}`}
                  aria-hidden={startMode !== "join"}
                >
                  <div className="v-section gap-xs">
                    <div className="room-code-field">
                      <input
                        type="text"
                        placeholder={t("gameStart.roomCode")}
                        value={joinCode}
                        maxLength={6}
                        autoCapitalize="characters"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="go"
                        onChange={(e) => {
                          setCodeError(false);
                          setJoinError(null);
                          setJoinCode(
                            e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, ""),
                          );
                        }}
                        onKeyDown={handleKeyDown}
                      />
                      {canScanQr && (
                        <button
                          type="button"
                          className="btn btn--sm room-code-field__scan"
                          onClick={() => setScannerOpen(true)}
                          aria-label={t("gameStart.scanQr")}
                          title={t("gameStart.scanQr")}
                        >
                          {/* camera icon */}
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              fill="currentColor"
                              d="M9 3 7.2 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <small
                      className={`txt-center lost ${codeError || joinError ? "" : "op-0"}`}
                    >
                      {codeError
                        ? t("gameStart.invalidCode")
                        : joinError || "\u00a0"}
                    </small>
                  </div>
                </div>
              </div>
              <div className="h-section gap-xs f-jc-c secondary-actions">
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => setHowToPlayModal(true)}
                >
                  {t("gameStart.howToPlayButton")}
                </button>
                {isMobileUa && (
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => setMobileView("ranking")}
                  >
                    {t("common.ranking")}
                  </button>
                )}
              </div>
              {!isMobileUa && (
                <div className="start-actions">{startButton}</div>
              )}
            </div>
          )}
          {isMobileUa ? (
            mobileView === "ranking" && (
              <div className="v-section gap-md w100">
                <div className="score__container--box dark w100 mobile-ranking">
                  {rankingPanel}
                </div>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost mx-auto"
                  onClick={() => setMobileView("play")}
                >
                  {t("common.back")}
                </button>
              </div>
            )
          ) : (
            <div className="ranking ranking--lg v-section gap-md top-scores">
              <div className="score__container--box dark">{rankingPanel}</div>
            </div>
          )}
        </div>
        <UserBadge />
        {/* Top-right corner: "¿Falta algo?" next to the sound button */}
        <div className="panel-actions">
          <HelpButton onClick={() => setFeedbackOpen(true)} />
          <GameSound />
        </div>
      </div>
      {/* Mobile: outside the panel, stuck to the bottom of the screen */}
      {isMobileUa && <div className="screen-actions">{startButton}</div>}
      <WordFeedbackModal
        isOpen={feedbackOpen}
        setModalOpen={setFeedbackOpen}
        lastLevelWords={[]}
        difficulty={gameDifficulty}
        roomName={playerName}
      />
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCode={handleScannedCode}
      />
      <HowToPlayModal
        isOpen={howToPlayModal}
        setHowToPlayModal={setHowToPlayModal}
      />
    </>
  );
}
