import { useMemo, useState } from "react";

import useGameStore from "../store/useGameStore";
import { useRoomRealtimeStore } from "../realtime/roomRealtime";
import useHostPlays from "../hooks/useHostPlays";
import arrowLeft from "../assets/arrow-left.svg";
import arrowRight from "../assets/arrow-right.svg";

type Player = {
  id: number;
  name: string;
  score: number;
  last_round_score?: number;
  role: "host" | "player";
};

interface PlayersRankingProps {
  title?: string;
  sortBy?: "score" | "last_round_score";
  toggleable?: boolean;
  /** Hide the title row (e.g. when tabs above already name the list) */
  showTitle?: boolean;
}

export default function PlayersRanking({
  title = "RANKING",
  sortBy = "score",
  toggleable = false,
  showTitle = true,
}: PlayersRankingProps) {
  const { playerName } = useGameStore();
  // Lista de jugadores y presencia mantenidas por roomRealtime
  const players = useRoomRealtimeStore((s) => s.players) as Player[];
  const online = useRoomRealtimeStore((s) => s.online);
  const presenceReady = useRoomRealtimeStore((s) => s.presenceReady);
  const [showLastRound, setShowLastRound] = useState(
    sortBy === "last_round_score",
  );

  const hostPlays = useHostPlays();
  const nonHostPlayers = useMemo(
    // The host only competes in rooms without a main screen
    () => players.filter((p) => hostPlays || p.role !== "host"),
    [players, hostPlays],
  );
  const effectiveKey = toggleable
    ? showLastRound
      ? "last_round_score"
      : "score"
    : sortBy;
  const effectiveTitle = toggleable
    ? showLastRound
      ? "ÚLTIMA RONDA"
      : "RANKING TOTAL"
    : title;
  const sorted = useMemo(() => {
    const key = effectiveKey as "score" | "last_round_score";
    return [...nonHostPlayers].sort(
      (a: any, b: any) => (b[key] || 0) - (a[key] || 0),
    );
  }, [nonHostPlayers, effectiveKey]);

  return (
    <div className="v-section gap-sm f-jc-c">
      {showTitle && (
      <div className="h-section f-jc-sb f-ai-c">
        {toggleable && (
          <img
            src={arrowLeft}
            alt="arrow-left"
            width={40}
            height={40}
            onClick={() => setShowLastRound((prev) => !prev)}
          />
        )}
        <div className="pos-rel w100">
          <h2 className="highlight max-w70">{effectiveTitle}</h2>
        </div>
        {toggleable && (
          <img
            src={arrowRight}
            alt="arrow-right"
            width={40}
            height={40}
            onClick={() => setShowLastRound((prev) => !prev)}
          />
        )}
      </div>
      )}
      <div className="v-section gap-2xs">
        {sorted.length > 0 ? (
          sorted.map((player, index) => {
            const value =
              effectiveKey === "last_round_score"
                ? (player.last_round_score ?? 0)
                : (player.score ?? 0);
            const placeClass =
              index === 0
                ? "won"
                : index === 1
                  ? "highlight"
                  : index === 2
                    ? "unguessed"
                    : "lost";
            const isMe = player.name === playerName;
            return (
              <div className="h-section gap-sm" key={player.id}>
                <h5 className={placeClass}>
                  {String(index + 1).padStart(2, "0")}
                </h5>
                <h5 className={isMe ? "tip" : "highlight"}>{player.name}</h5>
                {presenceReady && (
                  <span
                    className={`presence-dot ${online[`player:${player.id}`] ? "presence-dot--online" : ""}`}
                    title={online[`player:${player.id}`] ? "Conectado" : "Desconectado"}
                  />
                )}
                <h5 className={isMe ? "tip ml-auto" : "unguessed ml-auto"}>
                  {value}
                </h5>
              </div>
            );
          })
        ) : (
          <h4 className="lost">TODAVÍA NO HAY PUNTUACIONES</h4>
        )}
      </div>
    </div>
  );
}
