import { useState, useEffect } from "react";
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
import { primeMobileKeyboard } from "../utils/mobileKeyboard";
import GameSound from "../atoms/GameSound";
import PlayersSelector from "../atoms/PlayersSelector";

import Difficulty from "../types/Difficulty";
import { START_TIME } from "../constant";

export default function GameStart() {
  const {
    playerName,
    setPlayerName,
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
  const [error, setError] = useState(false);
  const [howToPlayModal, setHowToPlayModal] = useState(false);
  // Mobile: ranking is a tab of the screen instead of a modal
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

  const handleSubmit = async () => {
    const nameValidation = roomManager.validatePlayerName(playerName);
    if (!nameValidation.valid) {
      setError(true);
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
        navigate(`/game?id=${roomCode}`);
      } else {
        setError(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setError(false);
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setPlayerName(value);
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
    // Validar nombre usando RoomManager
    const nameValidation = roomManager.validatePlayerName(playerName);
    if (!nameValidation.valid) {
      setError(true);
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

  const startButton = (
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
              <DifficultySelector
                gameDifficulty={gameDifficulty}
                onDifficultyChange={handleDifficultyChange}
                showDailyChallenge={players === "single"}
                onDailyChallengeClick={handleDailyChallenge}
                loadingDaily={loadingChallenge}
                isDailyChallengeSelected={isDailyChallengeSelected}
              />
              <PlayersSelector
                players={players}
                setPlayers={setPlayers}
                onDifficultyChange={handleDifficultyChange}
              />
              <div className="v-section gap-xs">
                <input
                  className="mx-auto"
                  type="text"
                  placeholder={t("common.enterName")}
                  value={playerName}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                />
                <small className={`txt-center ${error ? "" : "op-0"}`}>
                  {t("gameStart.nameError")}
                </small>
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
        <GameSound />
      </div>
      {/* Mobile: outside the panel, stuck to the bottom of the screen */}
      {isMobileUa && <div className="screen-actions">{startButton}</div>}
      <HowToPlayModal
        isOpen={howToPlayModal}
        setHowToPlayModal={setHowToPlayModal}
      />
    </>
  );
}
