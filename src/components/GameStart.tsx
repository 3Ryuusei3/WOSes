import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

import GameLogo from '../atoms/GameLogo';

import useRandomWords from '../hooks/useRandomWords';
import useBackgroundAudio from '../hooks/useBackgroundAudio';

import useGameStore from '../store/useGameStore';

import supabase from './../config/supabaseClient';

export default function GameStart() {
  const { player, setPlayer, setMode } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  useRandomWords();
  useBackgroundAudio(0.5, 1000);

  const handleSubmit = async () => {
    if (playerName?.length >= 3 && playerName?.length <= 10) {
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('id');

      if (roomId) {
        const { data: roomData, error } = await supabase
          .from('users')
          .select('*')
          .eq('room_id', roomId);

        if (error) {
          setError(true);
          return;
        }

        const role = roomData.length === 1 ? 'host' : 'player';
        const { error: userError } = await supabase
        .from('users')
        .insert([{ nickname: playerName, role, room_id: roomId }])
        .select();

        if (userError) throw userError;
        setPlayer({ name: playerName, role, score: 0 });
      }
    } else {
      setError(true);
    }
  };

  const handleGameStart = () => {
    setMode('loading');
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setError(false);
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setPlayerName(value);
  };

  useEffect(() => {
    const checkRoomId = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('id');

      if (roomId) {
        const { data, error } = await supabase
          .from('rooms')
          .select('room')
          .eq('room', roomId);

        if (error || data.length === 0) {
          navigate('/');
        }
      }
    };

    checkRoomId();
  }, [navigate]);

  console.log(player);

  return (
    <>
      {(player && player.role === 'screen') ? (
        <>
          <GameLogo />
          <div className='game__container f-jc-c'>
            <div className="v-section gap-md">
              <div className='h-section gap-md w100 f-jc-c f-ai-c'>
                <h2 className='highlight'>ESPERANDO A MÁS JUGADORES</h2>
                <div className="qr__container">
                  <h4 className='highlight ws-nw'>ACCEDE A ESTE QR Y<br/>ÚNETE A LA PARTIDA</h4>
                  <Link to={window.location.href}>
                    <QRCodeSVG
                      value={window.location.href}
                      bgColor='#420072'
                      size={170}
                      fgColor='#ddccff'
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (player && player.role === 'host') ? (
        <>
          <h4 className='highlight'>TU NOMBRE:</h4>
          <h2 className='highlight'>{player.name}</h2>
          <button onClick={handleGameStart}>EMPEZAR PARTIDA</button>
        </>
      ) : (player && player.role === 'player') ? (
        <>
          <h4 className='highlight'>TU NOMBRE:</h4>
          <h2 className='highlight'>{player.name}</h2>
          <button disabled>ESPERANDO AL ANFITRIÓN</button>
        </>
      ) : (
        <>
          <div className="h-section gap-xs w100">
            <input
              className='mx-auto'
              type='text'
              placeholder='NOMBRE'
              value={playerName}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
            <small className={`txt-center ${error ? '' : 'op-0'}`}>
              EL NOMBRE DEBE TENER ENTRE 3 Y 12 CARACTERES
            </small>
          </div>
          <button onClick={handleSubmit}>ENTRAR A LA SALA</button>
        </>
      )}
    </>
  );
}
