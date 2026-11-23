import GameScreen from "./GameScreen";
import GameStart from "./GameStart";
import GameLost from "./GameLost";
import GameLobby from "./GameLobby";
import GameLoading from "./GameLoading";
import GameRoom from "./GameRoom";
import ConnectionStatus from "../atoms/ConnectionStatus";
import { ToastContainer } from "../atoms/Toast";

import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

import GameLogo from "../atoms/GameLogo";

import { shouldUseFluidScale } from "../hooks/fluidScale";

import useGameStore from "../store/useGameStore";
import useRoomSync from "../hooks/useRoomSync";
import { useRoomRealtimeStore } from "../realtime/roomRealtime";
import { loadRoomSession } from "../realtime/roomSession";

const GamePage = () => {
  const { mode, setRoomCode, setMode, role, players } = useGameStore();
  const [searchParams] = useSearchParams();
  // Única suscripción en tiempo real de la sala (multijugador)
  useRoomSync();
  const rtRoundId = useRoomRealtimeStore((s) => s.round?.id ?? 0);
  // En multi, cada ronda monta un GameScreen nuevo aunque se salte el lobby
  const gameScreenKey = players === "multi" ? `round-${rtRoundId}` : "single";

  const roomId = searchParams.get("id");
  useEffect(() => {
    if (roomId && mode === "start") {
      setRoomCode(roomId);
      // ¿Ya estaba en esta sala (recarga / reabrir enlace)? Recuperamos su
      // identidad; useRoomSync lo lleva a la pantalla que toque.
      const session = loadRoomSession(roomId);
      if (session) {
        const s = useGameStore.getState();
        s.setPlayerName(session.name);
        s.setRole("player");
        s.setPlayers("multi");
        s.setRoomId(session.roomId);
        s.setPlayerId(session.playerId);
      }
      setMode("room");
    }
  }, [roomId, mode, setRoomCode, setMode]);

  const isScaled = shouldUseFluidScale(role, !!roomId);

  return (
    <main>
      {players === "multi" && <ConnectionStatus />}
      <ToastContainer />
      <GameLogo large={isScaled} />
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
