import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import useGameStore from "../store/useGameStore";
import useRandomWords from "../hooks/useRandomWords";
import { startRound, joinRoomAsPlayer } from "../services/multiplayer";
import { useRoomRealtimeStore } from "../realtime/roomRealtime";
import { saveRoomSession } from "../realtime/roomSession";
import { isValidPlayerName } from "../utils";
import { useTranslation } from "react-i18next";
import { showToast } from "../atoms/Toast";

export default function GameRoom() {
  const { t } = useTranslation();
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
    gameDifficulty,
    setPlayers,
    setPlayerId,
  } = useGameStore();

  // Genera la palabra de la primera ronda (solo host; respeta la dificultad)
  useRandomWords(gameDifficulty);

  // Jugadores y presencia vienen de la capa de tiempo real (useRoomSync)
  const roomPlayers = useRoomRealtimeStore((s) => s.players);
  const online = useRoomRealtimeStore((s) => s.online);
  const presenceReady = useRoomRealtimeStore((s) => s.presenceReady);
  const [nameError, setNameError] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const isHost = role === "host";

  const nonHostPlayers = useMemo(
    () => roomPlayers.filter((p) => p.role !== "host"),
    [roomPlayers],
  );

  const canStart = nonHostPlayers.length >= 1;

  const handleStart = async () => {
    if (!roomCode || !canStart || isStarting || !randomWord) return;
    setIsStarting(true);
    try {
      const { gameTime } = useGameStore.getState();
      const { data, error } = await startRound(roomCode, randomWord, gameTime);

      if (error || !data) {
        showToast(
          "Error al iniciar la partida" + (error ? ": " + error.message : ""),
          "error",
        );
        return;
      }

      setMode("loading");
    } catch {
      showToast("Error inesperado al iniciar la partida", "error");
    } finally {
      setIsStarting(false);
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
        saveRoomSession({
          code: roomCode,
          roomId: data.room.id,
          playerId: data.player.id,
          name: playerName,
        });
        // La dificultad y el estado de la sala llegan con el snapshot
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
    <div className="game__container game__container--join">
      <div className="game__room">
        {isHost ? (
          <>
            <div className="v-section gap-md f-jc-c">
              <div className="v-section gap-md">
                <div className="score__container--box dark">
                  <div className="v-section gap-sm f-jc-c f-ai-c">
                    <QRCodeSVG
                      value={window.location.href}
                      bgColor="#420072"
                      size={170}
                      fgColor="#ddccff"
                      // rem so it scales with the rest of the layout
                      style={{ width: "10.625rem", height: "10.625rem" }}
                    />
                    <button
                      onClick={copyUrl}
                      className="btn btn--xs btn--win mx-auto"
                    >
                      {roomCode}
                    </button>
                  </div>
                </div>
                <div className="v-section gap-sm f-jc-c f-ai-c">
                  <button
                    className={`btn ${canStart ? "btn--win" : "btn--lose"}`}
                    disabled={!canStart || isStarting}
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
                          {presenceReady && (
                            <span
                              className={`presence-dot ${online[`player:${player.id}`] ? "presence-dot--online" : ""}`}
                              title={
                                online[`player:${player.id}`]
                                  ? "Conectado"
                                  : "Desconectado"
                              }
                            />
                          )}
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
