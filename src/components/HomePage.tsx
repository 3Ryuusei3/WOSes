import { Link } from 'react-router-dom';

import GameLogo from '../atoms/GameLogo';

import { generateRandomRoom } from '../utils/index';

const HomePage = () => {

  return (
    <div className='home'>
      <div className="container gap-xl">
        <GameLogo width={250} />
        <div className="h-section gap-sm">
          <h2 className='title'>DISFRUTA DE WORDS ON STREAM</h2>
          <h1 className='highlight'>EN ESPAÑOL</h1>
          <Link to={generateRandomRoom()} className='btn'>
            JUGAR
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
