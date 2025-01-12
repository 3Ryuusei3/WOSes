import { useState } from 'react';

import GameLogo from '../atoms/GameLogo';

import useGameStore from '../store/useGameStore';

export default function GameStart() {
  const { playerName, setPlayerName, setMode } = useGameStore();
  const [error, setError] = useState(false);

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
        <h2 className='highlight'>INTRODUCE TU NOMBRE</h2>
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
        <button onClick={handleSubmit}>JUGAR</button>
      </div>
    </>
  );
}
