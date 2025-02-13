import { Link } from 'react-router-dom';

import GameLogo from '../atoms/GameLogo';

const HomePage = () => {

  return (
    <div className='home'>
      <div className="container gap-xl">
        <GameLogo width={250} />
        <div className="v-section gap-sm">
          <h2 className='title'>DISFRUTA DE WORDS ON STREAM</h2>
          <h1 className='highlight'>EN ESPAÑOL</h1>
          <h4 className='highlight'>PRÓXIMAMENTE EN MULTIJUGADOR</h4>
          <Link to="/game" className='btn'>
            JUGAR
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
