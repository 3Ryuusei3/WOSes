import userIcon from './../assets/user.svg';
import usersIcon from './../assets/users.svg';

interface PlayersSelectorProps {
  players: string;
  setPlayers: (players: string) => void;
  enableMulti?: boolean;
}

export default function PlayersSelector({ players, setPlayers, enableMulti = true }: PlayersSelectorProps) {
  const handlePlayers = (players: string) => {
    setPlayers(players);
  };

  return (
    <div className="h-section gap-xs f-jc-c pos-rel w-fit mx-auto">
      <button
        className={`btn ${players === 'single' ? 'selected' : ''} btn--xs`}
        onClick={() => handlePlayers('single')}
      >
        <img src={userIcon} alt='user' className='player-selector' />
      </button>
      {enableMulti && (
        <button
          className={`btn ${players === 'multi' ? 'selected' : ''} btn--xs`}
          onClick={() => handlePlayers('multi')}
        >
          <img src={usersIcon} alt='users' className='player-selector' />
        </button>
      )}
    </div>
  );
}
