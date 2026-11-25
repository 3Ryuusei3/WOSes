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
import SegmentedTabs from "../atoms/SegmentedTabs";
import useGroupName from "../hooks/useGroupName";

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
  const groupName = useGroupName();
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

  const copyUrl = async () => {
    // navigator.clipboard only exists on https / localhost
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(t("room.linkCopied"), "info", 2000);
    } catch {
      /* nothing to do: the code is on screen */
    }
  };

  const showJoinForm = !isHost && (role !== "player" || !roomId);

  // Host with a main screen on a desktop: QR and players side by side (it is
  // what the TV shows). Everyone else (host that plays, players, phones):
  // tabs, so each part gets the whole panel.
  const mainScreen = isHost && !hostPlays;
  const useTabs = !(mainScreen && !isMobile);
  const [roomTab, setRoomTab] = useState<"invite" | "players">(
    isHost ? "invite" : "players",
  );

  // QR + room code (anyone in the room can show it to invite others)
  const invitePanel = (
    <div className="score__container--box dark room-invite">
      <div className="room-invite__qr">
        <QRCodeSVG
          value={window.location.href}
          bgColor="#fff6dc"
          size={256}
          fgColor="#24004a"
          marginSize={2}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <button onClick={copyUrl} className="btn btn--sm btn--win mx-auto">
        {roomCode}
      </button>
      <small className="txt-center unguessed">{t("room.scanToJoin")}</small>
    </div>
  );

  // Players in the room (host and players see the same list)
  const playersPanel = (
    <div className="v-section score__container--box dark player-list room-players">
      {!useTabs && <h2 className="highlight">{t("room.playersList")}</h2>}
      <div className="v-section gap-xs">
        {listedPlayers.length > 0 ? (
          listedPlayers.map((player, index) => (
            <div
              className={`h-section gap-sm f-ai-c player-row ${player.id === playerId ? "player-row--me" : ""}`}
              key={player.id}
            >
              <h3 className="won">{String(index + 1).padStart(2, "0")}</h3>
              <h3 className={player.id === playerId ? "won" : "highlight"}>
                {player.name}
              </h3>
              {presenceReady && (
                <span
                  className={`presence-dot ${online[`${player.role}:${player.id}`] ? "presence-dot--online" : ""}`}
                  title={
                    online[`${player.role}:${player.id}`] ? "Conectado" : "Desconectado"
                  }
                />
              )}
              <h3 className="unguessed ml-auto">{player.score}</h3>
            </div>
          ))
        ) : (
          <h3 className="lost txt-center">{t("room.noPlayers")}</h3>
        )}
      </div>
    </div>
  );

  // Everyone on their device: the group's name, so all know their game
  const groupHeading = groupName && (
    <h2 className="txt-center">
      <span className="unguessed">{t("room.group")} </span>
      <span className="won">{groupName}</span>
    </h2>
  );

  const roomTabs = (
    <>
      {groupHeading}
      <SegmentedTabs
        tabs={[
          { key: "invite", label: t("room.invite") },
          {
            key: "players",
            label: `${t("room.players")} (${listedPlayers.length})`,
          },
        ]}
        active={roomTab}
        onChange={setRoomTab}
      />
      {roomTab === "invite" ? invitePanel : playersPanel}
    </>
  );

  const startBlock = (
    <div className="v-section gap-sm f-jc-c f-ai-c">
      <button
        className="btn btn--start"
        disabled={!canStart || isStarting}
        onClick={handleStart}
      >
        {t("room.startGame")}
      </button>
      {!canStart && (
        <small className="txt-center">{t("room.needPlayer")}</small>
      )}
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
        {/* Ribbon on the panel's top edge: what this screen is */}
        <h1
          className={`screen-ribbon ${showJoinForm && !isHost ? "" : "screen-ribbon--green"}`}
        >
          {isHost
            ? t("room.created")
            : showJoinForm
              ? t("room.roomTitle", { code: roomCode })
              : t("room.youAreIn")}
        </h1>
        {isHost ? (
          <div className="room-lobby">
            {useTabs ? (
              roomTabs
            ) : (
              <div className="room-lobby__split">
                {invitePanel}
                {playersPanel}
              </div>
            )}
            {startBlock}
          </div>
        ) : showJoinForm ? (
          <div className="game__room">
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
          </div>
        ) : (
          <div className="room-lobby">
            <div className="score__container--box dark room-lobby__status">
              <p className="txt-center">{t("game.waitingForHost")}</p>
            </div>
            {roomTabs}
          </div>
        )}
        {showJoinForm && !isMobile && joinAction}
      </div>
      {/* Mobile: outside the panel, stuck to the bottom of the screen */}
      {showJoinForm && isMobile && joinAction}
    </>
  );
}
