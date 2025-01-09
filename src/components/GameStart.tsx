import logo from './../assets/logo.png';

interface GameStartProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  setMode: React.Dispatch<React.SetStateAction<"start" | "lobby" | "game" | "lost">>;
}

export default function GameStart({ playerName, setPlayerName, setMode }: GameStartProps) {
  return (
    <>
      <img src={logo} alt='logo' width={170} />
      <div className='game__container'>
        <h2>SELECCIONA TU NOMBRE</h2>
        <input className='mx-auto' type='text' value={playerName} onChange={e => setPlayerName(e.target.value)} />
        <button onClick={() => {
          setMode('game')
        } }>JUGAR</button>
      </div>
    </>
  )
}
