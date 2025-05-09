import useGameStore from '../store/useGameStore';

import soundOff from './../assets/speaker-off.svg';
import soundLow from './../assets/speaker-low.svg'
import soundHigh from './../assets/speaker-high.svg';

export default function GameSound() {
  const { volume, setVolume } = useGameStore();

  const volumeState = volume === 0 ? 'off' : volume === 0.2 ? 'low' : 'high';

  return (
    <img
      src={volumeState === 'high' ? soundHigh : volumeState === 'low' ? soundLow : soundOff}
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
