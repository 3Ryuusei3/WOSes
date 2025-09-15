import { useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

import useGameStore from '../store/useGameStore';
import { getRoomPlayers, subscribeToRoomPlayers } from '../services/multiplayer';
import arrowLeft from '../assets/arrow-left.svg';
import arrowRight from '../assets/arrow-right.svg';

type Player = { id: number; name: string; score: number; last_round_score?: number; role: 'host' | 'player' };

interface PlayersRankingProps {
  title?: string;
  sortBy?: 'score' | 'last_round_score';
  toggleable?: boolean;
}

export default function PlayersRanking({ title = 'RANKING', sortBy = 'score', toggleable = false }: PlayersRankingProps) {
  const { roomId } = useGameStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [showLastRound, setShowLastRound] = useState(sortBy === 'last_round_score');

  useEffect(() => {
    if (roomId) {
      getRoomPlayers(roomId).then(({ data }) => {
        if (data) setPlayers(data as unknown as Player[]);
      });
      if (!channelRef.current) {
        channelRef.current = subscribeToRoomPlayers(roomId, () => {
          getRoomPlayers(roomId).then(({ data }) => {
            if (data) setPlayers(data as unknown as Player[]);
          });
        });
      }
    }
    return () => {
      if (channelRef.current) channelRef.current.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId]);

  const nonHostPlayers = useMemo(() => players.filter(p => p.role !== 'host'), [players]);
  const effectiveKey = toggleable ? (showLastRound ? 'last_round_score' : 'score') : sortBy;
  const effectiveTitle = toggleable ? (showLastRound ? 'ÚLTIMA RONDA' : 'RANKING TOTAL') : title;
  const sorted = useMemo(() => {
    const key = effectiveKey as 'score' | 'last_round_score';
    return [...nonHostPlayers].sort((a: any, b: any) => (b[key] || 0) - (a[key] || 0));
  }, [nonHostPlayers, effectiveKey]);

  return (
    <div className="v-section gap-lg f-jc-c">
      {toggleable && (
        <div className={`top-scores__arrows top-scores__arrows`}>
          <img src={arrowLeft} alt="arrow-left" onClick={() => setShowLastRound(prev => !prev)} />
          <img src={arrowRight} alt="arrow-right" onClick={() => setShowLastRound(prev => !prev)} />
        </div>
      )}
      <div className="pos-rel">
        <h4 className="highlight max-w70">{effectiveTitle}</h4>
      </div>
      <div className="v-section gap-2xs">
        {sorted.length > 0 ? (
          sorted.map((player, index) => {
            const value = effectiveKey === 'last_round_score' ? (player.last_round_score ?? 0) : (player.score ?? 0);
            return (
              <div className="h-section gap-sm" key={player.id}>
                <h6 className="won">{String(index + 1).padStart(2, '0')}</h6>
                <h6 className="highlight">{player.name}</h6>
                <h6 className="unguessed ml-auto">{value}</h6>
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
