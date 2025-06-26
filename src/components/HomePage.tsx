import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import GameLogo from '../atoms/GameLogo';

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className='home'>
      <div className="container gap-xl">
        <GameLogo width={250} />
        <div className="v-section gap-sm">
          <h2 className='title'>{t('home.title')}</h2>
          <h1 className='highlight'>{t('home.subtitle')}</h1>
          <h4 className='highlight'>{t('home.multiplayer')}</h4>
          <div className="h-section gap-xs f-jc-c mb-sm">
            <Link to="/game" className='btn'>
              {t('common.play')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
