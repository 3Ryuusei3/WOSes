import GameLogo from '../atoms/GameLogo';

interface GameLobbyProps {
  setMode: React.Dispatch<React.SetStateAction<"start" | "lobby" | "game" | "lost" | "loading">>;
  totalPoints: number;
  lastRoundPoints: number;
  level: number;
  levelsToAdvance: number;
}

export default function GameLobby({ setMode, totalPoints, lastRoundPoints, level, levelsToAdvance }: GameLobbyProps) {
  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
        <h1 className='highlight'>¡ENHORABUENA!</h1>
        <h3>HAS AVANZADO <span className='highlight'>{levelsToAdvance}</span> NIVEL{levelsToAdvance > 1 ? 'ES': ''}</h3>
        <div className="v-section mx-auto gap-md">
          <div className='score__container--box'>
            <p>PUNTOS DEL NIVEL {level - levelsToAdvance}</p>
            <h3>{lastRoundPoints}</h3>
          </div>
          <div className='score__container--box'>
            <p>TUS PUNTOS TOTALES</p>
            <h3>{totalPoints}</h3>
          </div>
        </div>
        <button onClick={() => {
          setMode('loading');
        } }>JUGAR AL NIVEL {level}</button>
      </div>
    </>
  )
}
