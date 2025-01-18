import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import GameLogo from '../atoms/GameLogo';

import useGameStore from '../store/useGameStore';

import { generateRandomRoom } from '../utils/index';

import supabase from './../config/supabaseClient';

const HomePage = () => {
  const [buttonText, setButtonText] = useState('CREAR PARTIDA');
  const { setPlayer } = useGameStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setButtonText('CREANDO PARTIDA...');

    try {
      const room = generateRandomRoom();
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert([{ room }])
        .select();

      if (roomError) throw roomError;

      const roomId = roomData[0].room;
      const { error: userError } = await supabase
        .from('users')
        .insert([{ nickname: 'screen', role: 'screen', room_id: roomId }])
        .select();

      if (userError) throw userError;

      setPlayer({ name: 'screen', role: 'screen', score: 0 });
      navigate(`/game?id=${roomId}`);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className='home'>
      <div className="container gap-xl">
        <GameLogo width={250} />
        <div className="h-section gap-sm">
          <h2 className='title'>DISFRUTA DE WORDS ON STREAM</h2>
          <h1 className='highlight'>EN ESPAÑOL</h1>
          <button onClick={handleSubmit}>{buttonText}</button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
