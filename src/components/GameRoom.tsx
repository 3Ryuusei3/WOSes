import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from "qrcode.react";
import useGameStore from '../store/useGameStore';
import useLanguageWords from '../hooks/useLanguageWords';
import { getRoomPlayers, subscribeToRoomPlayers, startRoomWithWord, joinRoomAsPlayer, subscribeToRoom } from '../services/multiplayer';
import { isValidPlayerName } from '../utils';
import { useTranslation } from 'react-i18next';

export default function GameRoom() {
  const { t } = useTranslation();
  const { roomCode, playerName, setPlayerName, role, setRole, roomId, setRoomId, setMode, randomWord, setRandomWord, setPossibleWords, setHiddenLetterIndex, gameDifficulty, setPlayers, setPlayerId } = useGameStore();
  const { words } = useLanguageWords(gameDifficulty);
  const [roomPlayers, setRoomPlayers] = useState<{ id: number; name: string; score: number; role: 'host' | 'player' }[]>([]);
  const playersChannelRef = useRef<ReturnType<typeof subscribeToRoomPlayers> | null>(null);
  const roomChannelRef = useRef<ReturnType<typeof subscribeToRoom> | null>(null);
  const [nameError, setNameError] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const isHost = role === 'host';

  useEffect(() => {
    // Initial fetch of players if roomId is known
    if (roomId) {
      getRoomPlayers(roomId).then(({ data }) => {
        if (data) setRoomPlayers(data);
      });

      // Subscribe to realtime players list
      if (!playersChannelRef.current) {
        playersChannelRef.current = subscribeToRoomPlayers(roomId, () => {
          getRoomPlayers(roomId).then(({ data }) => {
            if (data) setRoomPlayers(data);
          });
        });
      }

      // Subscribe to room state to transition when host starts
      if (!roomChannelRef.current) {
        roomChannelRef.current = subscribeToRoom(roomId, (payload) => {
          const newRoom = (payload.new as any);
          const newState = newRoom?.state;
          const currentWord = newRoom?.current_word as string | null;
          if (currentWord) {
            setRandomWord(currentWord);
            // Build possible words based on current word
            const countLetters = (w: string) => w.split('').reduce((acc: any, l: string) => { acc[l] = (acc[l] || 0) + 1; return acc; }, {});
            const canFormWord = (wc: any, lc: any) => Object.keys(wc).every(k => (lc[k] || 0) >= wc[k]);
            const lettersCount = countLetters(currentWord);
            const possible = (words || []).filter((w) => canFormWord(countLetters(w), lettersCount));
            possible.sort((a, b) => a.length - b.length || a.localeCompare(b));
            setPossibleWords(possible);
            setHiddenLetterIndex(Math.floor(Math.random() * currentWord.length));
          }
          if (newState === 'loading') {
            setMode('loading');
          } else if (newState === 'game') {
            setMode('game');
          } else if (newState === 'lobby') {
            setMode('lobby');
          } else if (newState === 'lost') {
            setMode('lost');
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
  }, [roomId]);

  const nonHostPlayers = useMemo(() => roomPlayers.filter(p => p.role !== 'host'), [roomPlayers]);

  const canStart = nonHostPlayers.length >= 2;

  const handleStart = async () => {
    if (!roomCode || !canStart) return;
    // Host sets current word for all
    const currentWord = randomWord || '';
    const { data, error } = await startRoomWithWord(roomCode, currentWord);
    if (!error && data) {
      setMode('loading');
    }
  };

  const handleJoin = async () => {
    setJoinError(null);
    if (!roomCode || !playerName) return;
    if (!isValidPlayerName(playerName)) {
      setNameError(true);
      return;
    }
    const { data, error } = await joinRoomAsPlayer(roomCode, playerName);
    if (!error && data) {
      setRole('player');
      setRoomId(data.room.id);
      setPlayerId(data.player.id);
      setPlayers('multi');
    } else if (error) {
      setJoinError(error.message || 'No se puede acceder a la sala');
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className='game__container f-jc-c f-ai-c pos-rel'>
      <div className="h-section gap-xl">
        {isHost ? (
          <>
            <div className='v-section gap-md f-jc-c'>
              <div className="v-section gap-md">
                <div className="score__container--box dark">
                  <div className="v-section gap-sm">
                    <QRCodeSVG
                      value={window.location.href}
                      bgColor='#420072'
                      size={170}
                      fgColor='#ddccff'
                    />
                    <button onClick={copyUrl} className="btn btn--xs btn--win mx-auto">{roomCode}</button>
                  </div>
                </div>
                <div className="v-section gap-sm">
                  <button className={`btn ${canStart ? 'btn--win' : 'btn--lose'}`} disabled={!canStart} onClick={handleStart}>
                    EMPEZAR PARTIDA
                  </button>
                  {!canStart && <small className="txt-center">SE NECESITAN AL MENOS<br/>2 JUGADORES PARA EMPEZAR</small>}
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
                          <h4 className="won">{String(index + 1).padStart(2, '0')}</h4>
                          <h4 className="highlight" key={player.id}>{player.name}</h4>
                          <h4 className="unguessed ml-auto">{player.score}</h4>
                        </div>
                      ))
                    ) : (
                      <h4 className="lost">TODAVÍA NO HAY<br/>JUGADORES EN LA SALA</h4>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {role !== 'player' || !roomId ? (
              <div className="v-section gap-md f-jc-c">
                <h4 className="highlight">INTRODUCE TU NOMBRE<br/>PARA UNIRTE A LA SALA</h4>
                <div className="v-section gap-md">
                  <input
                    className='mx-auto'
                    type='text'
                    placeholder={t('common.typePlayerName')}
                    value={playerName}
                    onChange={(e) => { setNameError(false); setJoinError(null); setPlayerName(e.target.value.toUpperCase()); }}
                  />
                  <small className={`txt-center ${nameError ? '' : 'op-0'}`}>{t('gameStart.nameError')}</small>
                  <small className={`txt-center lost ${joinError ? '' : 'op-0'}`}>{joinError || ''}</small>
                  <button className='btn mx-auto' onClick={handleJoin} disabled={!isValidPlayerName(playerName)}>ENTRAR A LA SALA</button>
                </div>
              </div>
            ) : (
              <div className="v-section gap-md f-jc-c">
                <div className="score__container--box dark">
                  <p className="txt-center">ESPERANDO AL ANFITRIÓN...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
