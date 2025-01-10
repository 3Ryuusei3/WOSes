import GameLogo from '../atoms/GameLogo';
interface GameLostProps {
  setMode: React.Dispatch<React.SetStateAction<"start" | "lobby" | "game" | "lost" | "loading">>;
  totalPoints: number;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
  level: number;
}

export default function GameLost({ setMode, totalPoints, setTotalPoints, level }: GameLostProps) {
  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
        <h1 className='lost'>HAS PERDIDO...</h1>
        <h3>HAS ALCANZADO EL NIVEL <span className='highlight'>{level}</span></h3>
        <div className="v-section mx-auto gap-md">
          <div className='score__container--box'>
            <p>TUS PUNTOS TOTALES HAN SIDO</p>
            <h3>{totalPoints}</h3>
          </div>
        </div>
        <button onClick={() => {
          setMode('start');
          setTotalPoints(0);
        } }>JUGAR DE NUEVO</button>
      </div>
    </>
  )
}
