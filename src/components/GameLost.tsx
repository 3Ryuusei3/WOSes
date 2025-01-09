import logo from './../assets/logo.png';

interface GameLostProps {
  setMode: React.Dispatch<React.SetStateAction<"start" | "lobby" | "game" | "lost">>;
  totalPoints: number;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
}

export default function GameLost({ setMode, totalPoints, setTotalPoints }: GameLostProps) {
  return (
    <>
      <img src={logo} alt='logo' width={170} />
      <div className='game__container'>
        <h2>HAS PERDIDO...</h2>
        <h4>TUS PUNTOS HAN SIDO: {totalPoints}</h4>
        <button onClick={() => {
          setMode('start');
          setTotalPoints(0);
        } }>JUGAR DE NUEVO</button>
      </div>
    </>
  )
}
