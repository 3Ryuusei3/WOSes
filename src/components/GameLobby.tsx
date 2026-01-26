import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Tooltip from "../atoms/Tooltip";
import GameSound from "../atoms/GameSound";
import DifficultyTag from "../atoms/DifficultyTag";
import MechanicsModal from "../atoms/MechanicsModal";
import MechanicItem from "../atoms/MechanicItem";

import useRemoveSeconds from "../hooks/useRemoveSeconds";
import useRandomWords from "../hooks/useRandomWords";
import useSetMechanics from "../hooks/useSetMechanics";
import useWindowSize from "../hooks/useWindowSize";
import useRoomStateSync from "../hooks/useRoomStateSync";
import useRealtimeConnection from "../hooks/useRealtimeConnection";

import useGameStore from "../store/useGameStore";

import levelPassedSound from "../assets/win.mp3";
import reloadIcon from "../assets/reload.svg";

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
  } = useGameStore();

  const { words } = useLanguageWords(gameDifficulty);

  const isPlayer = players === "multi" && role === "player";

  const { columns } = useWindowSize();
  const { t, i18n } = useTranslation();

  const [canAdvance, setCanAdvance] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState("");
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

  // Reset seeded flag when entering lobby (seeding now happens in handleAdvance)
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

  useSetMechanics(gameMechanics, level);
  useRandomWords(gameDifficulty);
  const secondsToRemove = useRemoveSeconds();

  const handleStateSync = useCallback(
    (newState: {
      state?: string;
      current_word?: string;
      difficulty?: string;
    }) => {
      console.log("[GameLobby] Synced state:", newState);

      if (newState.difficulty) {
        setGameDifficulty(newState.difficulty as Difficulty);
      }

      if (
        newState.current_word &&
        (newState.state === "loading" || newState.state === "game")
      ) {
        setRandomWord(newState.current_word);
        const countLetters = (w: string) =>
          w.split("").reduce((acc: any, l: string) => {
            acc[l] = (acc[l] || 0) + 1;
            return acc;
          }, {});
        const canFormWord = (wc: any, lc: any) =>
          Object.keys(wc).every((k) => (lc[k] || 0) >= wc[k]);
        const lettersCount = countLetters(newState.current_word);
        const possible = (words || []).filter((w) =>
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
      console.log("[GameLobby] Reconnected - auto-syncing state");
      if (isPlayer) {
        syncNow();
      }
    },
  });

  const showReconnectButton = isPlayer;

  const handleAdvance = useCallback(async () => {
    if (!canAdvance) return;

    // Host in multiplayer: start next round via DB so all devices follow
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
          const countLetters = (w: string) =>
            w.split("").reduce((acc: any, l: string) => {
              acc[l] = (acc[l] || 0) + 1;
              return acc;
            }, {});
          const canFormWord = (wc: any, lc: any) =>
            Object.keys(wc).every((k) => (lc[k] || 0) >= wc[k]);
          const lettersCount = countLetters(randomWord);
          const possible = (words || []).filter((w) =>
            canFormWord(countLetters(w), lettersCount),
          );
          possible.sort((a, b) => a.length - b.length || a.localeCompare(b));
          const seedResult = await seedRoundWords(roomCode, possible);
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

        // Esperar un momento mejorado para que el seeding se complete en el servidor
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

  // Realtime: follow room state while in Lobby
  useEffect(() => {
    if (!roomId) return;
    const channel = subscribeToRoom(roomId, (payload: any) => {
      const newRoom = payload.new as any;
      const newState = newRoom?.state;
      const currentWord = newRoom?.current_word as string | null;
      
      console.log("[GameLobby] Realtime event received, newState:", newState, "current mode:", "lobby");
      
      // Prevenir transiciones redundantes
      if (newState === "lobby") {
        console.log("[GameLobby] Already in lobby - skipping");
        return;
      }
      
      // Importante: en lobby no forzamos la palabra desde BBDD, el host genera una nueva localmente
      if (currentWord && (newState === "loading" || newState === "game")) {
        setRandomWord(currentWord);
        // Recalculate possible words for everyone
        const countLetters = (w: string) =>
          w.split("").reduce((acc: any, l: string) => {
            acc[l] = (acc[l] || 0) + 1;
            return acc;
          }, {});
        const canFormWord = (wc: any, lc: any) =>
          Object.keys(wc).every((k) => (lc[k] || 0) >= wc[k]);
        const lettersCount = countLetters(currentWord);
        const possible = (words || []).filter((w) =>
          canFormWord(countLetters(w), lettersCount),
        );
        possible.sort((a, b) => a.length - b.length || a.localeCompare(b));
        setPossibleWords(possible);
        setHiddenLetterIndex(Math.floor(Math.random() * currentWord.length));
      }
      
      console.log("[GameLobby] Transitioning from lobby to", newState);
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

  const areAllMechanicsFalse = gameMechanics
    ? Object.values(gameMechanics).every((value) => value === false)
    : false;

  const getDictionaryUrl = (word: string) => {
    if (i18n.language === "en") {
      return `https://www.merriam-webster.com/dictionary/${word.toLowerCase()}`;
    }
    return `https://dle.rae.es/${word}`;
  };

  if (players === "multi" && role === "player") {
    return (
      <div className="game__container f-jc-c">
        <PlayersPanel lastLevelWords={lastLevelWords} />
        <div className="h-section gap-xs f-jc-c mb-sm">
          <button
            onClick={syncNow}
            disabled={isSyncing}
            className={`btn btn--xs ${connectionStatus !== "connected" ? "btn--lose" : ""}`}
            title={
              connectionStatus !== "connected"
                ? "Reconectar"
                : "Actualizar estado"
            }
          >
            <img src={reloadIcon} alt="reload" className="player-selector" />
          </button>
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
        <DifficultyTag gameDifficulty={gameDifficulty} />
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
        <div className="score__container--box f-jc-c">
          <div className="v-section gap-xs">
            <div className="h-section gap-lg f-jc-sb f-ai-c">
              <p>
                {t("common.levelPoints", { level: level - levelsToAdvance })}
              </p>
              <h4 className="highlight">{lastRoundPoints}</h4>
            </div>
            <div className="h-section gap-lg f-jc-sb f-ai-c">
              <p>{t("common.totalPoints")}</p>
              <h4 className="highlight">{totalPoints}</h4>
            </div>
            <div className="h-section gap-lg f-jc-sb f-ai-c">
              <p>{t("common.remainingTime")}</p>
              <h4>
                <span
                  className={`${levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR ? "won" : secondsToRemove > 0 ? "lost" : "highlight"}`}
                >
                  {gameTime}
                  {t("common.seconds")}
                </span>
              </h4>
            </div>
            <div className="h-section gap-lg f-jc-sb f-ai-c">
              <p>{t("common.numberOfRounds")}</p>
              <h4>
                <span className="highlight">{numberOfRounds}</span>
              </h4>
            </div>
            <div className="h-section gap-lg f-jc-sb f-ai-c">
              <p>{t("common.perfectRounds")}</p>
              <h4>
                <span
                  className={`${levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR ? "won" : "highlight"}`}
                >
                  {numberOfPerfectRounds}
                </span>
              </h4>
            </div>
          </div>
        </div>
        <div className="v-section score__container--box">
          <Tooltip message={t("game.wordMeaning")}>
            <div className="info-icon">i</div>
          </Tooltip>
          <p>{t("common.lastWords")}</p>
          <div
            className="v-section score__container--wordlist"
            style={
              {
                "--wordlist-rows": Math.ceil(lastLevelWords.length / columns),
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
        {gameMechanics && (
          <>
            <div className="v-section score__container--box">
              <p>{t("lobby.nextChallenges")}</p>
              {canAdvance && !areAllMechanicsFalse && (
                <Tooltip message={t("lobby.challengeTooltip")}>
                  <div className="info-icon">i</div>
                </Tooltip>
              )}
              <div className="v-section">
                {!canAdvance ? (
                  <h4 className="highlight">{t("common.loading")}</h4>
                ) : areAllMechanicsFalse ? (
                  <h4
                    className="won"
                    dangerouslySetInnerHTML={{
                      __html: t("lobby.noChallenges"),
                    }}
                  ></h4>
                ) : (
                  Object.entries(gameMechanics).map(
                    ([key, value]) =>
                      value && (
                        <MechanicItem
                          key={key}
                          mechanicKey={key}
                          onClick={handleMechanicClick}
                        />
                      ),
                  )
                )}
              </div>
            </div>
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
          <button
            onClick={syncNow}
            disabled={isSyncing}
            className={`btn btn--xs ${connectionStatus !== "connected" ? "btn--lose" : ""}`}
            title={
              connectionStatus !== "connected"
                ? "Reconectar"
                : "Actualizar estado"
            }
          >
            <img src={reloadIcon} alt="reload" className="player-selector" />
          </button>
        )}
      </div>
      <GameSound />
    </div>
  );
}
