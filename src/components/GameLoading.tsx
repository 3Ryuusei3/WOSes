import GameLogo from '../atoms/GameLogo';
import useCountdown from '../hooks/useCountdown';

export default function GameLoading() {
  const countdown = useCountdown();

  return (
    <>
      <GameLogo />
      <div className='game__container'>
        <h1 className='highlight'>EL JUEGO COMIENZA EN...</h1>
        <div className="loading__container">
          <h2 className='highlight'>{countdown}</h2>
          <div className="loading__container--box loading__container--box-xl"></div>
          <div className="loading__container--box loading__container--box-lg"></div>
          <div className="loading__container--box loading__container--box-md"></div>
          <div className="loading__container--box"></div>
        </div>
      </div>
    </>
  )
}
