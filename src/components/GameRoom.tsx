import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import useGameStore from "../store/useGameStore";
import useLanguageWords from "../hooks/useLanguageWords";
import useRandomWords from "../hooks/useRandomWords";
import {
  getRoomPlayers,
  subscribeToRoomPlayers,
  startRoomWithWord,
  joinRoomAsPlayer,
  subscribeToRoom,
  seedRoundWords,
} from "../services/multiplayer";
import { isValidPlayerName } from "../utils";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import Difficulty from "../types/Difficulty";
import { showToast } from "../atoms/Toast";

export default function GameRoom() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    roomCode,
    playerName,
    setPlayerName,
    role,
    setRole,
    roomId,
    setRoomId,
    setMode,
    randomWord,
    setRandomWord,
    setPossibleWords,
    setHiddenLetterIndex,
    gameDifficulty,
    setPlayers,
    setPlayerId,
    setGameDifficulty,
    setRoomCode,
  } = useGameStore();
  const { words } = useLanguageWords(gameDifficulty);

  // Generate random word for multiplayer (respecting difficulty rules)
  useRandomWords(gameDifficulty);

  const [roomPlayers, setRoomPlayers] = useState<
    { id: number; name: string; score: number; role: "host" | "player" }[]
  >([]);
  const playersChannelRef = useRef<ReturnType<
    typeof subscribeToRoomPlayers
  > | null>(null);
  const roomChannelRef = useRef<ReturnType<typeof subscribeToRoom> | null>(
    null,
  );
  const [nameError, setNameError] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const isHost = role === "host";

  useEffect(() => {
    if (roomId) {
      getRoomPlayers(roomId).then(({ data }) => {
        if (data) setRoomPlayers(data);
      });

      supabase
        .from("rooms")
        .select("difficulty")
        .eq("id", roomId)
        .single()
        .then(({ data }) => {
          if (data && data.difficulty) {
            setGameDifficulty(data.difficulty as Difficulty);
          }
        });

      if (!playersChannelRef.current) {
        playersChannelRef.current = subscribeToRoomPlayers(roomId, () => {
          getRoomPlayers(roomId).then(({ data }) => {
            if (data) setRoomPlayers(data);
          });
        });
      }

      if (!roomChannelRef.current) {
        roomChannelRef.current = subscribeToRoom(roomId, (payload) => {
          const newRoom = payload.new as any;
          const newState = newRoom?.state;
          const newDifficulty = newRoom?.difficulty as Difficulty | undefined;
          const newRoomCode = newRoom?.new_room_code as string | undefined;

          if (newRoomCode && role === "player") {
            showToast("El anfitrión ha creado una nueva sala", "info", 3000);

            setMode("room");
            setRoomCode(newRoomCode);
            setRoomId(null);
            setPlayerId(null);

            setTimeout(() => {
              navigate(`/game?id=${newRoomCode}`);
            }, 1000);
            return;
          }

          if (newState === "room") {
            return;
          }
          if (newDifficulty) {
            setGameDifficulty(newDifficulty);
          }

          const currentWord = newRoom?.current_word as string | null;
          if (currentWord) {
            setRandomWord(currentWord);
            const countLetters = (w: string) =>
              w.split("").reduce((acc: any, l: string) => {
                acc[l] = (acc[l] || 0) + 1;
                return acc;
              }, {});
            const canFormWord = (wc: any, lc: any) =>
              Object.keys(wc).every((k) => (lc[k] || 0) >= wc[k]);
            const lettersCount = countLetters(currentWord);
            // Filter words by length first (same as useRandomWords)
            const filteredWords = (words || []).filter(
              (word) => word.length >= 4 && word.length <= 9,
            );
            const possible = filteredWords.filter((w) =>
              canFormWord(countLetters(w), lettersCount),
            );
            possible.sort((a, b) => a.length - b.length || a.localeCompare(b));
            setPossibleWords(possible);
            setHiddenLetterIndex(
              Math.floor(Math.random() * currentWord.length),
            );
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
    }

    return () => {
      if (playersChannelRef.current) playersChannelRef.current.unsubscribe();
      playersChannelRef.current = null;
      if (roomChannelRef.current) roomChannelRef.current.unsubscribe();
      roomChannelRef.current = null;
    };
  }, [
    roomId,
    role,
    setGameDifficulty,
    setRandomWord,
    setPossibleWords,
    setHiddenLetterIndex,
    setMode,
    setRoomCode,
    setRoomId,
    setPlayerId,
    navigate,
    words,
  ]);

  const nonHostPlayers = useMemo(
    () => roomPlayers.filter((p) => p.role !== "host"),
    [roomPlayers],
  );

  const canStart = nonHostPlayers.length >= 1;

  const handleStart = async () => {
    if (!roomCode || !canStart) return;

    try {
      const currentWord = randomWord || "";
      const { data, error } = await startRoomWithWord(roomCode, currentWord);

      if (error) {
        showToast("Error al iniciar la partida: " + error.message, "error");
        return;
      }

      if (!data) {
        showToast("No se pudo iniciar la partida", "error");
        return;
      }

      let seedingSuccess = false;
      try {
        if (words && words.length > 0) {
          // Use the same logic as useRandomWords to ensure possibleWords has proper range
          const countLetters = (w: string) =>
            w.split("").reduce((acc: any, l: string) => {
              acc[l] = (acc[l] || 0) + 1;
              return acc;
            }, {});
          const canFormWord = (wc: any, lc: any) =>
            Object.keys(wc).every((k) => (lc[k] || 0) >= wc[k]);
          const wordCount = countLetters(currentWord);
          // Filter words that can be formed and have proper length
          const filteredWords = words.filter(
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
            showToast(
              "Advertencia: algunas palabras podrían no sincronizarse",
              "warning",
              3000,
            );
          }
        }
      } catch (err) {
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
      showToast("Error inesperado al iniciar la partida", "error");
    }
  };

  const handleJoin = async () => {
    setJoinError(null);
    if (!roomCode || !playerName) return;
    if (!isValidPlayerName(playerName)) {
      setNameError(true);
      return;
    }

    try {
      const { data, error } = await joinRoomAsPlayer(roomCode, playerName);
      if (!error && data) {
        setRole("player");
        setRoomId(data.room.id);
        setPlayerId(data.player.id);
        setPlayers("multi");

        const { data: roomRow } = await supabase
          .from("rooms")
          .select("difficulty")
          .eq("id", data.room.id)
          .single();

        const diff = (roomRow as any)?.difficulty as Difficulty | undefined;
        if (diff) {
          setGameDifficulty(diff);
        }
      } else if (error) {
        setJoinError(error.message || "No se puede acceder a la sala");
      }
    } catch (err) {
      setJoinError("Error al intentar unirse a la sala");
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="game__container f-jc-c f-ai-c pos-rel">
      <div className="h-section gap-xl">
        {isHost ? (
          <>
            <div className="v-section gap-md f-jc-c">
              <div className="v-section gap-md">
                <div className="score__container--box dark">
                  <div className="v-section gap-sm">
                    <QRCodeSVG
                      value={window.location.href}
                      bgColor="#420072"
                      size={170}
                      fgColor="#ddccff"
                    />
                    <button
                      onClick={copyUrl}
                      className="btn btn--xs btn--win mx-auto"
                    >
                      {roomCode}
                    </button>
                  </div>
                </div>
                <div className="v-section gap-sm">
                  <button
                    className={`btn ${canStart ? "btn--win" : "btn--lose"}`}
                    disabled={!canStart}
                    onClick={handleStart}
                  >
                    EMPEZAR PARTIDA
                  </button>
                  {!canStart && (
                    <small className="txt-center">
                      SE NECESITA AL MENOS
                      <br />1 JUGADOR PARA EMPEZAR
                    </small>
                  )}
                </div>
              </div>
            </div>
            <div className="v-section gap-md f-jc-c">
              <div className="v-section score__container--box dark player-list">
                <div className="v-section gap-lg f-jc-c">
                  <h2 className="highlight">LISTADO DE JUGADORES</h2>
                  <div className="v-section gap-2xs">
                    {nonHostPlayers.length > 0 ? (
                      nonHostPlayers.map((player, index) => (
                        <div className="h-section gap-sm" key={player.id}>
                          <h4 className="won">
                            {String(index + 1).padStart(2, "0")}
                          </h4>
                          <h4 className="highlight" key={player.id}>
                            {player.name}
                          </h4>
                          <h4 className="unguessed ml-auto">{player.score}</h4>
                        </div>
                      ))
                    ) : (
                      <h4 className="lost">
                        TODAVÍA NO HAY
                        <br />
                        JUGADORES EN LA SALA
                      </h4>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {role !== "player" || !roomId ? (
              <div className="v-section gap-md f-jc-c">
                <h4 className="highlight">
                  INTRODUCE TU NOMBRE
                  <br />
                  PARA UNIRTE A LA SALA
                </h4>
                <div className="v-section gap-md">
                  <input
                    className="mx-auto"
                    type="text"
                    placeholder={t("common.typePlayerName")}
                    value={playerName}
                    onChange={(e) => {
                      setNameError(false);
                      setJoinError(null);
                      setPlayerName(e.target.value.toUpperCase());
                    }}
                  />
                  <small className={`txt-center ${nameError ? "" : "op-0"}`}>
                    {t("gameStart.nameError")}
                  </small>
                  <small
                    className={`txt-center lost ${joinError ? "" : "op-0"}`}
                  >
                    {joinError || ""}
                  </small>
                  <button
                    className="btn btn--sm mx-auto"
                    onClick={handleJoin}
                    disabled={!isValidPlayerName(playerName)}
                  >
                    {t("game.joinRoom")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="v-section gap-md f-jc-c">
                <div className="score__container--box dark">
                  <div className="v-section gap-md">
                    <p className="txt-center">{t("game.waitingForHost")}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
