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
import useMobileUserAgent from "../hooks/useMobileUserAgent";

import useGameStore from "../store/useGameStore";
import {
  MobileRankingOpenButton,
  RankingPopupModal,
} from "../atoms/RankingPopup";
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
  const [rankingPopupOpen, setRankingPopupOpen] = useState(false);
  const [isDailyChallengeSelected, setIsDailyChallengeSelected] =
    useState(false);
  const isMobileUa = useMobileUserAgent();
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
      startDailyChallenge();
      return;
    }

    if (players === "single") {
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
      return t("common.start", { difficulty: t("difficulties.daily") });
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
  const rankingChallengeNumber =
    isDailyChallengeSelected || gameDifficulty === "daily"
      ? dailyChallenge?.challenge_number
      : undefined;

  const rankingPanel = (
    <>
      {alreadyPlayed &&
        (isDailyChallengeSelected || gameDifficulty === "daily") && (
          <p className="daily-retry-note">{t("dailyChallenge.retryNote")}</p>
        )}
      <TopScores
        difficulty={rankingDifficulty}
        challengeNumber={rankingChallengeNumber}
      />
    </>
  );

  return (
    <>
      <div className="game__container f-jc-c pos-rel">
        <div className="h-section gap-lg">
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
            <h6
              className="highlight cursor"
              onClick={() => setHowToPlayModal(true)}
            >
              <u>{t("gameStart.learnToPlay")}</u>
            </h6>
            <div className="h-section gap-xs f-jc-c">
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
            </div>
          </div>
          {isMobileUa ? (
            <>
              <MobileRankingOpenButton
                onClick={() => setRankingPopupOpen(true)}
              />
              <RankingPopupModal
                isOpen={rankingPopupOpen}
                onClose={() => setRankingPopupOpen(false)}
              >
                <div className="score__container--box dark w100">
                  {rankingPanel}
                </div>
              </RankingPopupModal>
            </>
          ) : (
            <div className="ranking ranking--lg v-section gap-md top-scores">
              <div className="score__container--box dark">{rankingPanel}</div>
            </div>
          )}
        </div>
        <GameSound />
      </div>
      <HowToPlayModal
        isOpen={howToPlayModal}
        setHowToPlayModal={setHowToPlayModal}
      />
    </>
  );
}
