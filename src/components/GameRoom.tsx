import { useMemo, useState } from "react";
import BackHomeButton from "../atoms/BackHomeButton";
import { QRCodeSVG } from "qrcode.react";
import useGameStore from "../store/useGameStore";
import useRandomWords from "../hooks/useRandomWords";
import { startRound } from "../services/multiplayer";
import useJoinRoom from "../hooks/useJoinRoom";
import useHostPlays from "../hooks/useHostPlays";
import { useRoomRealtimeStore } from "../realtime/roomRealtime";
import { isValidPlayerName } from "../utils";
import { useTranslation } from "react-i18next";
import { showToast } from "../atoms/Toast";
import useMobileLayout from "../hooks/useMobileLayout";
import { primeMobileKeyboard } from "../utils/mobileKeyboard";

export default function GameRoom() {
  const { t } = useTranslation();
  const {
    roomCode,
    playerName,
    setPlayerName,
    role,
    roomId,
    playerId,
    setMode,
    randomWord,
    gameDifficulty,
  } = useGameStore();

  // Genera la palabra de la primera ronda (solo host; respeta la dificultad)
  useRandomWords(gameDifficulty);

  // Jugadores y presencia vienen de la capa de tiempo real (useRoomSync)
  const roomPlayers = useRoomRealtimeStore((s) => s.players);
  const online = useRoomRealtimeStore((s) => s.online);
  const presenceReady = useRoomRealtimeStore((s) => s.presenceReady);
  const [nameError, setNameError] = useState(false);
  const { join, joinError, setJoinError } = useJoinRoom();
  const [isStarting, setIsStarting] = useState(false);

  const isHost = role === "host";
  const isMobile = useMobileLayout();

  const nonHostPlayers = useMemo(
    () => roomPlayers.filter((p) => p.role !== "host"),
    [roomPlayers],
  );
  // Without a main screen the host is one more player in the list
  const hostPlays = useHostPlays();
  const listedPlayers = useMemo(
    () => (hostPlays ? roomPlayers : nonHostPlayers),
    [hostPlays, roomPlayers, nonHostPlayers],
  );

  const canStart = nonHostPlayers.length >= 1;

  const handleStart = async () => {
    if (!roomCode || !canStart || isStarting || !randomWord) return;
    // Host that plays: the same tap opens its keyboard (see primeMobileKeyboard)
    primeMobileKeyboard();
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

    await join(roomCode, playerName);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const showJoinForm = !isHost && (role !== "player" || !roomId);

  // Players in the room (host and players see the same list)
  const playersPanel = (
    <div className="v-section gap-md f-jc-c">
      <div className="v-section score__container--box dark player-list">
        <div className="v-section gap-lg f-jc-c">
          <h2 className="highlight">LISTADO DE JUGADORES</h2>
          <div className="v-section gap-2xs">
            {listedPlayers.length > 0 ? (
              listedPlayers.map((player, index) => (
                <div className="h-section gap-sm" key={player.id}>
                  <h4 className="won">
                    {String(index + 1).padStart(2, "0")}
                  </h4>
                  <h4
                    className={player.id === playerId ? "won" : "highlight"}
                  >
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
                  <h4 className="unguessed ml-auto">
                    {player.score}
                  </h4>
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
  );

  const joinAction = (
    <div className="screen-actions">
      <button
        className="btn btn--sm mx-auto"
        onClick={handleJoin}
        disabled={!isValidPlayerName(playerName)}
      >
        {t("game.joinRoom")}
      </button>
    </div>
  );

  return (
    <>
      <div className="game__container game__container--join">
        <BackHomeButton className="back-control--corner" />
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
              {playersPanel}
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
                  </div>
                </div>
              ) : (
                <div className="v-section gap-md room-waiting">
                  <div className="score__container--box dark">
                    <div className="v-section gap-xs">
                      <p className="txt-center">{t("game.waitingForHost")}</p>
                      <small className="txt-center unguessed">
                        {t("gameStart.roomCode")} {roomCode}
                      </small>
                    </div>
                  </div>
                  {playersPanel}
                </div>
              )}
            </>
          )}
        </div>
        {showJoinForm && !isMobile && joinAction}
      </div>
      {/* Mobile: outside the panel, stuck to the bottom of the screen */}
      {showJoinForm && isMobile && joinAction}
    </>
  );
}
