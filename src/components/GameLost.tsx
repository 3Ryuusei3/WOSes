import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TopScores from "../atoms/TopScores";
import PlayersPanel from "../atoms/PlayersPanel";
import Tooltip from "../atoms/Tooltip";
import GameSound from "../atoms/GameSound";
import DifficultyTag from "../atoms/DifficultyTag";

import useGameStore from "../store/useGameStore";
import useWindowSize from "../hooks/useWindowSize";
import useLanguageWords from "../hooks/useLanguageWords";
import useRealtimeConnection from "../hooks/useRealtimeConnection";

import gameOverSound from "../assets/gameover.mp3";
import { START_TIME } from "../constant";
import {
  createRoomWithHost,
  setNewRoomCode,
  subscribeToRoom,
} from "../services/multiplayer";
import { showToast } from "../atoms/Toast";

export default function GameLost() {
  const { t, i18n } = useTranslation();
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
    roomId,
    setRandomWord,
    setPossibleWords,
    setHiddenLetterIndex,
    setPreviousRoundsWords,
    currentChallengeNumber,
    gameTime,
  } = useGameStore();

  const isDailyChallenge = gameDifficulty === "daily";
  const isDailyChallengeCompleted = isDailyChallenge && 
    lastLevelWords.length > 0 && 
    lastLevelWords.every(word => word.guessed);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { columns } = useWindowSize();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const roomChannelRef = useRef<any>(null);
  const { words } = useLanguageWords(gameDifficulty);
  const { forceReconnect, isConnected } = useRealtimeConnection();

  const generateNewWord = () => {
    if (!words || words.length === 0) return null;

    const filteredWords = words.filter(
      (word: any) => word.length >= 4 && word.length <= 9,
    );
    const randomWord =
      filteredWords[Math.floor(Math.random() * filteredWords.length)];

    const countLetters = (w: string) =>
      w.split("").reduce((acc: any, l: string) => {
        acc[l] = (acc[l] || 0) + 1;
        return acc;
      }, {});

    const canFormWord = (wc: any, lc: any) =>
      Object.keys(wc).every((k) => (lc[k] || 0) >= wc[k]);

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

        const newRoomCode = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();

        const { data, error } = await createRoomWithHost(
          newRoomCode,
          playerName,
          gameDifficulty,
        );

        if (error || !data) {
          showToast("Error al crear la nueva sala", "error");
          setIsCreatingRoom(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        await setNewRoomCode(roomCode, newRoomCode);

        setRoomCode(newRoomCode);
        setRoomId(data.room.id);
        setPlayerId(data.host.id);

        setTotalPoints(0);
        setLevel(1);
        setGameMechanics({
          fake: false,
          hidden: false,
          first: false,
          dark: false,
          still: false,
        });
        setGameTime(START_TIME);
        setNumberOfPerfectRounds(0);
        setNumberOfRounds(0);
        setLevelsToAdvance(0);
        setPreviousRoundsWords([]);

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
      setTotalPoints(0);
      setLevel(1);
      setGameMechanics({
        fake: false,
        hidden: false,
        first: false,
        dark: false,
        still: false,
      });
      setGameTime(START_TIME);
      setNumberOfPerfectRounds(0);
      setNumberOfRounds(0);
      setLevelsToAdvance(0);
    }
  };

  const getDictionaryUrl = (word: string) => {
    if (i18n.language === "en") {
      return `https://www.merriam-webster.com/dictionary/${word.toLowerCase()}`;
    }
    return `https://dle.rae.es/${word}`;
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(gameOverSound);
      audioRef.current.volume = volume;

      audioRef.current.addEventListener(
        "canplaythrough",
        () => {
          audioRef.current
            ?.play()
            .catch((err) => console.error("Audio playback failed:", err));
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

  // Escuchar cambios en la sala para detectar new_room_code
  useEffect(() => {
    if (players === "multi" && role === "player" && roomId) {
      roomChannelRef.current = subscribeToRoom(roomId, (payload: any) => {
        const newRoom = payload.new as any;
        const newRoomCode = newRoom?.new_room_code as string | undefined;

        if (newRoomCode) {
          showToast("El anfitrión ha creado una nueva sala", "info", 3000);

          setTotalPoints(0);
          setLevel(1);
          setGameMechanics({
            fake: false,
            hidden: false,
            first: false,
            dark: false,
            still: false,
          });
          setGameTime(START_TIME);
          setNumberOfPerfectRounds(0);
          setNumberOfRounds(0);
          setLevelsToAdvance(0);
          setPreviousRoundsWords([]);
          setMode("room");
          setRoomCode(newRoomCode);
          setRoomId(null);
          setPlayerId(null);

          setRandomWord("");
          setPossibleWords([]);
          setHiddenLetterIndex(0);

          setTimeout(() => {
            navigate(`/game?id=${newRoomCode}`);
          }, 1000);
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
    players,
    role,
    roomId,
    navigate,
    setMode,
    setRoomCode,
    setRoomId,
    setPlayerId,
    setTotalPoints,
    setLevel,
    setGameMechanics,
    setGameTime,
    setNumberOfPerfectRounds,
    setNumberOfRounds,
    setLevelsToAdvance,
    setRandomWord,
    setPossibleWords,
    setHiddenLetterIndex,
    setPreviousRoundsWords,
  ]);

  if (players === "multi" && role === "player") {
    return (
      <div className="game__container f-jc-c">
        <PlayersPanel lastLevelWords={lastLevelWords} />
        <div className="v-section gap-md f-jc-c mt-sm">
          <div className="score__container--box dark">
            <p className="txt-center">{t("game.waitingForHost")}</p>
          </div>
          <div className="h-section gap-xs f-jc-c">
            <Link to="/game" className="btn btn--sm btn--lose">
              {t("game.exit")}
            </Link>
            {!isConnected && (
              <button onClick={forceReconnect} className="btn btn--sm">
                {t("game.reconnect")}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game__container f-jc-c">
      <div className="difficulty-tag">
        <DifficultyTag gameDifficulty={gameDifficulty} />
      </div>
      {isDailyChallenge ? (
        <>
          <h1 className={isDailyChallengeCompleted ? "won" : "lost"}>
            {isDailyChallengeCompleted
              ? t("dailyChallenge.completed")
              : t("dailyChallenge.lost")}
          </h1>
          <div className="h-section gap-md f-jc-c">
            <div className="v-section">
              <div className="score__container--box score__container--box-sm won">
                <p>{t("common.totalPoints")}</p>
                <h3>{totalPoints}</h3>
              </div>
            </div>
            <div className="v-section">
              <div className="score__container--box score__container--box-sm won">
                <p>{t("common.remainingTime")}</p>
                <h3>{gameTime}s</h3>
              </div>
            </div>
          </div>
          <div className="h-section gap-lg mx-auto">
            <div className="v-section score__container--box">
              <Tooltip message={t("game.wordMeaning")}>
                <div className="info-icon">i</div>
              </Tooltip>
              <p>{t("common.lastWords")}</p>
              <div
                className="v-section score__container--wordlist"
                style={
                  {
                    "--wordlist-rows": Math.ceil(
                      lastLevelWords.length / columns,
                    ),
                    "--wordlist-columns": columns,
                  } as React.CSSProperties
                }
              >
                {lastLevelWords.map((word, index) => (
                  <h4
                    className={`${word.guessed ? "highlight" : "unguessed"}`}
                    key={`${index}-${word}`}
                  >
                    <Link
                      to={getDictionaryUrl(word.word)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {word.word.toUpperCase()}
                    </Link>
                  </h4>
                ))}
              </div>
            </div>
            <div className="score__container--box pos-rel">
              <TopScores 
                hasTooltip 
                difficulty="daily" 
                challengeNumber={currentChallengeNumber!} 
              />
            </div>
          </div>
          <div className="h-section gap-xs f-jc-c mb-sm">
            <button className="btn" onClick={handlePlayAgain}>
              {t("common.startNewGame")}
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="lost">{t("game.lost")}</h1>
          <div className="h-section gap-md f-jc-c">
            <div className="v-section">
              <div className="score__container--box score__container--box-sm won">
                <p>{t("common.reachedLevel")}</p>
                <h3>{level}</h3>
              </div>
            </div>
            <div className="v-section">
              <div className="score__container--box score__container--box-sm won">
                <p>{t("common.totalPoints")}</p>
                <h3>{totalPoints}</h3>
              </div>
            </div>
            <div className="v-section">
              <div className="score__container--box score__container--box-sm won">
                <p>{t("common.numberOfRounds")}</p>
                <h3>{numberOfRounds}</h3>
              </div>
            </div>
            <div className="v-section">
              <div className="score__container--box score__container--box-sm won">
                <p>{t("common.perfectRounds")}</p>
                <h3>{numberOfPerfectRounds}</h3>
              </div>
            </div>
          </div>
          <div className="h-section gap-lg mx-auto">
            <div className="v-section gap-md">
              <div className="v-section score__container--box">
                <Tooltip message={t("game.wordMeaning")}>
                  <div className="info-icon">i</div>
                </Tooltip>
                <p>{t("common.lastWords")}</p>
                <div
                  className="v-section score__container--wordlist"
                  style={
                    {
                      "--wordlist-rows": Math.ceil(
                        lastLevelWords.length / columns,
                      ),
                      "--wordlist-columns": columns,
                    } as React.CSSProperties
                  }
                >
                  {lastLevelWords.map((word, index) => (
                    <h4
                      className={`${word.guessed ? "highlight" : "unguessed"}`}
                      key={`${index}-${word}`}
                    >
                      <Link
                        to={getDictionaryUrl(word.word)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {word.word.toUpperCase()}
                      </Link>
                    </h4>
                  ))}
                </div>
              </div>
            </div>
            <div className="score__container--box pos-rel">
              <TopScores hasTooltip difficulty={gameDifficulty} />
            </div>
          </div>
          <div className="h-section gap-xs f-jc-c mb-sm">
            <Link to="/game" className="btn btn--sm btn--lose">
              {t("game.exit")}
            </Link>
            <button onClick={handlePlayAgain} disabled={isCreatingRoom}>
              {isCreatingRoom
                ? t("game.creatingNewRoom")
                : t("common.playAgain")}
            </button>
          </div>
        </>
      )}
      <GameSound />
    </div>
  );
}
