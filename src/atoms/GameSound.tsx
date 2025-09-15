import useGameStore from '../store/useGameStore';

import soundOffIcon from './../assets/speaker-off.svg';
import soundLowIcon from './../assets/speaker-low.svg'
import soundHighIcon from './../assets/speaker-high.svg';

export default function GameSound() {
  const { volume, setVolume, players, role } = useGameStore();
  const isPlayer = players === 'multi' && role === 'player';
  const effectiveVolume = isPlayer ? 0 : volume;
  const volumeState = effectiveVolume === 0 ? 'off' : effectiveVolume === 0.2 ? 'low' : 'high';

  if (isPlayer) {
    return null;
  }

  return (
    <img
      src={volumeState === 'high' ? soundHighIcon : volumeState === 'low' ? soundLowIcon : soundOffIcon}
      alt='volume'
      className='volume-control'
      onClick={() => {
        if (volumeState === 'high') {
          setVolume(0);
        } else if (volumeState === 'off') {
          setVolume(0.2);
        } else {
          setVolume(0.4);
        }
      }}
    />
  );
}
