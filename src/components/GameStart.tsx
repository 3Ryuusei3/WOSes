import GameLogo from '../atoms/GameLogo';

import useGameStore from '../store/useGameStore';

export default function GameStart() {
  const { playerName, setPlayerName, setMode } = useGameStore();

  const handleSubmit = () => {
    setMode('loading')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <>
      <GameLogo />
      <div className='game__container f-jc-c'>
        <h2 className='highlight'>INTRODUCE TU NOMBRE</h2>
        <input
          className='mx-auto'
          type='text'
          placeholder='NOMBRE'
          value={playerName}
          onChange={e => setPlayerName(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
        />
        <button onClick={() => {handleSubmit()}}>JUGAR</button>
      </div>
    </>
  )
}
