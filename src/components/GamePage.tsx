import GameScreen from "./GameScreen";
import GameStart from "./GameStart";
import GameLost from "./GameLost";
import GameLobby from "./GameLobby";
import GameLoading from "./GameLoading";
import GameRoom from "./GameRoom";
import ConnectionStatus from "../atoms/ConnectionStatus";
import { ToastContainer } from "../atoms/Toast";

import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import GameLogo from "../atoms/GameLogo";
import PlayerNameModal from "../atoms/PlayerNameModal";
import ExitConfirmModal from "../atoms/ExitConfirmModal";

import { shouldUseFluidScale } from "../hooks/fluidScale";
import useMobileLayout from "../hooks/useMobileLayout";

import useGameStore from "../store/useGameStore";
import useRoomSync from "../hooks/useRoomSync";
import { useRoomRealtimeStore } from "../realtime/roomRealtime";
import {
  hasLeftRoom,
  loadRoomSession,
  saveHostProgress,
} from "../realtime/roomSession";
import { requestExit } from "../utils/leaveToHome";

const GamePage = () => {
  const { t } = useTranslation();
  const isMobileLayout = useMobileLayout();
  const { mode, setRoomCode, setMode, players } = useGameStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  // Única suscripción en tiempo real de la sala (multijugador)
  useRoomSync();
  const rtRoundId = useRoomRealtimeStore((s) => s.round?.id ?? 0);
  // En multi, cada ronda monta un GameScreen nuevo aunque se salte el lobby
  const gameScreenKey = players === "multi" ? `round-${rtRoundId}` : "single";

  const roomId = searchParams.get("id");
  // Opens the room of the address only when the address changes to it (a
  // link, a reload, a new room). Not when the screen goes back to "start"
  // while the old address is still there (leaving the room).
  const handledRoomRef = useRef<string | null>(null);
  useEffect(() => {
    if (!roomId) {
      handledRoomRef.current = null;
      return;
    }
    if (handledRoomRef.current === roomId || mode !== "start") return;
    handledRoomRef.current = roomId;

    // ¿Ya estaba en esta sala (recarga / reabrir enlace)? Recuperamos su
    // identidad; useRoomSync lo lleva a la pantalla que toque.
    const session = loadRoomSession(roomId);
    if (!session && hasLeftRoom(roomId)) {
      // Old link to a room we left (browser back): stay on the start screen
      navigate("/", { replace: true });
      return;
    }
    setRoomCode(roomId);
    if (session) {
      const s = useGameStore.getState();
      s.setPlayerName(session.name);
      s.setRole(session.role ?? "player");
      s.setPlayers("multi");
      s.setRoomId(session.roomId);
      s.setPlayerId(session.playerId);
      if (session.role === "host" && session.progress) {
        const p = session.progress;
        s.setLevel(p.level);
        s.setTotalPoints(p.totalPoints);
        s.setNumberOfRounds(p.numberOfRounds);
        s.setNumberOfPerfectRounds(p.numberOfPerfectRounds);
        s.setGameTime(p.gameTime);
      }
    }
    setMode("room");
  }, [roomId, mode, setRoomCode, setMode, navigate]);

  // Host: keep the run progress with the saved session (survives a reload)
  const progressRole = useGameStore((s) => s.role);
  const progressCode = useGameStore((s) => s.roomCode);
  const level = useGameStore((s) => s.level);
  const totalPoints = useGameStore((s) => s.totalPoints);
  const numberOfRounds = useGameStore((s) => s.numberOfRounds);
  const numberOfPerfectRounds = useGameStore((s) => s.numberOfPerfectRounds);
  const gameTime = useGameStore((s) => s.gameTime);
  useEffect(() => {
    if (players !== "multi" || progressRole !== "host" || !progressCode) return;
    saveHostProgress(progressCode, {
      level,
      totalPoints,
      numberOfRounds,
      numberOfPerfectRounds,
      gameTime,
    });
  }, [
    players,
    progressRole,
    progressCode,
    level,
    totalPoints,
    numberOfRounds,
    numberOfPerfectRounds,
    gameTime,
  ]);

  // Browser / gesture "back" outside the start screen does what our back
  // button does (asks first when leaving would lose something), instead of
  // showing a screen that no longer makes sense
  const awayFromStart = mode !== "start";
  useEffect(() => {
    if (!awayFromStart) return;
    const guard = () => window.history.pushState({ wosesGuard: true }, "");
    guard();
    const onPop = () => {
      guard();
      requestExit(navigate);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [awayFromStart, navigate]);

  // Address follows the screen: "/" on the start screen, "/game" otherwise.
  // A room link (/game?id=CODE) stays as is while it opens the room.
  useEffect(() => {
    const onStart = mode === "start" && !roomId;
    if (onStart && pathname !== "/") {
      navigate("/", { replace: true });
    } else if (!onStart && pathname !== "/game") {
      navigate(`/game${search}`, { replace: true });
    }
  }, [mode, roomId, pathname, search, navigate]);

  const isScaled = shouldUseFluidScale();

  return (
    <main>
      {players === "multi" && <ConnectionStatus />}
      <ToastContainer />
      <PlayerNameModal />
      <ExitConfirmModal />
      {/* Start screen (desktop): big logo with the tagline under it */}
      {/* Start screen (desktop): big logo with the tagline under it. While
          playing, the game bar takes the logo's place. */}
      {mode === "game" ? null : !isMobileLayout && mode === "start" ? (
        <GameLogo large width={320} tagline={t("gameStart.nameAndDifficulty")} />
      ) : (
        <GameLogo large={isScaled} />
      )}
      <div className="container pos-rel">
        {mode === "start" ? (
          <GameStart />
        ) : mode === "game" ? (
          <GameScreen key={gameScreenKey} />
        ) : mode === "lost" ? (
          <GameLost />
        ) : mode === "loading" ? (
          <GameLoading />
        ) : mode === "room" ? (
          <GameRoom />
        ) : (
          <GameLobby />
        )}
      </div>
    </main>
  );
};

export default GamePage;
