import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

import GameLogo from '../atoms/GameLogo';

import useRandomWords from '../hooks/useRandomWords';
import useBackgroundAudio from '../hooks/useBackgroundAudio';

import useGameStore from '../store/useGameStore';
import { Link } from 'react-router-dom';

export default function GameStart() {
  const { playerName, setPlayerName, setMode } = useGameStore();
  const [error, setError] = useState(false);
  useRandomWords();

  useBackgroundAudio(0.5, 1000);

  const handleSubmit = () => {
    if (playerName.length >= 3 && playerName.length <= 12) {
      setMode('loading');
    } else {
      setError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setError(false);
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setPlayerName(value);
  };

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
        <div className="v-section gap-md">
          <div className='qr__container'>
            <h4 className='highlight'>ACCEDE A ESTE QR Y<br/>ÚNETE A LA PARTIDA</h4>
            <Link to={window.location.href}>
              <QRCodeSVG
                value={window.location.href}
                bgColor='#420072'
                size={170}
                fgColor='#ddccff'
              />
            </Link>
            <Link to={window.location.href}>
              <p className='link'>{window.location.href} </p>
            </Link>
          </div>
          <div className='h-section gap-md w100 f-jc-c'>
            <h2 className='highlight'>INTRODUCE TU NOMBRE<br/>PARA JUGAR</h2>
            <div className="h-section gap-xs">
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
            <button onClick={handleSubmit}>EMPEZAR PARTIDA</button>
          </div>
        </div>
      </div>
    </>
  );
}
