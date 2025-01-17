import GameLogo from '../atoms/GameLogo';

import { generateRandomRoom } from '../utils/index';

import supabase from './../config/supabaseClient';

const HomePage = () => {

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('rooms')
      .insert([{ room: generateRandomRoom() }])
      .select();

    if (error) {
      console.error('Error creating room', error);
    }

    if (data && data.length > 0) {
      const roomId = data[0].room;
      window.location.href = `/game?id=${roomId}`;
    }
  }

  return (
    <div className='home'>
      <div className="container gap-xl">
        <GameLogo width={250} />
        <div className="h-section gap-sm">
          <h2 className='title'>DISFRUTA DE WORDS ON STREAM</h2>
          <h1 className='highlight'>EN ESPAÑOL</h1>
          <button onClick={handleSubmit}>EMPEZAR PARTIDA</button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
