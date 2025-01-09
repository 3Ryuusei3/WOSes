import logo from './../assets/logo.png';

interface GameLobbyProps {
  setMode: React.Dispatch<React.SetStateAction<"start" | "lobby" | "game" | "lost">>;
  totalPoints: number;
  lastRoundPoints: number;
}

export default function GameLobby({ setMode, totalPoints, lastRoundPoints }: GameLobbyProps) {
  return (
    <>
      <img src={logo} alt='logo' width={170} />
      <div className='game__container'>
        <h2>¡HAS PASADO DE NIVEL!</h2>
        <h4>LOS PUNTOS DE ESTA RONDA SON: {lastRoundPoints}</h4>
        <h4>TUS PUNTOS TOTALES SON: {totalPoints}</h4>
        <button onClick={() => {
          setMode('game');
        } }>SIGUIENTE NIVEL</button>
      </div>
    </>
  )
}
