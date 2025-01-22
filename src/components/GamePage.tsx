import { useEffect } from 'react';

import GameScreen from './GameScreen';
import GameStart from './GameStart';
import GameLost from './GameLost';
import GameLobby from './GameLobby';
import GameLoading from './GameLoading';

import useZoom from '../hooks/useZoom';
import useGameStore from '../store/useGameStore';
import { getRoomIdFromURL } from '../utils/index';

import supabase from './../config/supabaseClient';

const GamePage = () => {
  const roomId = getRoomIdFromURL();
  const { mode, setMode, player } = useGameStore();
  const zoom = useZoom();

  useEffect(() => {
    const channel = supabase.channel(`realtime rooms`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `room=eq.${roomId}` }, (payload) => {
        const newMode = payload.new.mode;
        if (newMode && newMode !== mode) {
          setMode(newMode);
        }
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <main style={{ zoom: player && player.role === 'screen' ? zoom : 1 }}>
      <div className="container">
        {mode === 'start' ? (
          <GameStart />
        ) : mode === 'game' ? (
          <GameScreen />
        ) : mode === 'lost' ? (
          <GameLost />
        ) : mode === 'loading' ? (
          <GameLoading />
        ) : (
          <GameLobby />
        )}
      </div>
    </main>
  );
};

export default GamePage;
