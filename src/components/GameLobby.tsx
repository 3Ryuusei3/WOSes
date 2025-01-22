import { useEffect } from 'react';
import GameLogo from '../atoms/GameLogo';
import useRemoveSeconds from '../hooks/useRemoveSeconds';
import useRandomWords from '../hooks/useRandomWords';
import useCalculatePoints from '../hooks/useCalculatePoints';
import useGameStore from '../store/useGameStore';
import levelPassedSound from '../assets/win.mp3';

export default function GameLobby() {
  const {
    setMode,
    level,
    levelsToAdvance,
    lastLevelWords,
    player
  } = useGameStore();
  useRandomWords();
  const secondsToRemove = useRemoveSeconds();

  useEffect(() => {
    const audio = new Audio(levelPassedSound);
    audio.play();

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const { ranking } = useCalculatePoints(lastLevelWords);

  const allWordsGuessed = lastLevelWords.every(word => word.guessed_by !== null);

  return (
    <>
      {(player && player.role === 'screen') ? (
        <>
          <GameLogo />
          <div className='game__container f-jc-c'>
            {allWordsGuessed ? (
              <h1 className='won'>¡PERFECTO!</h1>
            ) : (
              <h1 className='highlight'>¡ENHORABUENA!</h1>
            )}
            <h3>
              HAS AVANZADO
              {allWordsGuessed ? (
                <span className='won'> {levelsToAdvance} </span>
              ) : (
                <span className='highlight'> {levelsToAdvance} </span>
              )}
              NIVEL{levelsToAdvance > 1 ? 'ES': ''}
            </h3>
            <div className="v-section gap-md mx-auto">
              <div className="h-section score__container--box">
                <p>RANKING</p>
                <div className="ranking__container">
                  {ranking.map((entry, index) => (
                    <table key={index} className="ranking__entry">
                      <tbody>
                        <tr>
                          <td>
                            <span className={
                            `${index === 0 ? 'won'
                              : index === 1 ? 'highlight'
                              : index === 2 ? 'unguessed' : 'lost'}`}>
                                {index + 1}
                            </span></td>
                          <td>{entry.player}</td>
                          <td>{entry.points}</td>
                        </tr>
                      </tbody>
                    </table>
                  ))}
                </div>
              </div>
              <div className="h-section score__container--box">
                <p>ÚLTIMAS PALABRAS</p>
                <div className="h-section score__container--wordlist" style={{ '--wordlist-rows': Math.ceil(lastLevelWords.length / 3) } as React.CSSProperties}>
                  {lastLevelWords.map((word, index) => (
                    <h4 className={`${word.guessed_by ? 'highlight' : 'unguessed'}`} key={`${index}-${word.word}`}>{word.word.toUpperCase()}</h4>
                  ))}
                </div>
              </div>
            </div>
            {secondsToRemove > 0 && (
              <h3>DISPONDRÁS DE <span className="lost">{secondsToRemove}s</span> MENOS EN EL SIGUIENTE NIVEL</h3>
            )}
          </div>
        </>
      ) : (player && player.role === 'host') ? (
        <>
          <h4 className='highlight'>TU NOMBRE:</h4>
          <h2 className='highlight'>{player.name}</h2>
          <button className='mx-auto' onClick={() => {setMode('loading')}}>
            JUGAR AL NIVEL {level}
          </button>
        </>
      ) : (
        <>
          <h4 className='highlight'>TU NOMBRE:</h4>
          <h2 className='highlight'>{player.name}</h2>
          <button disabled>ESPERANDO AL ANFITRIÓN</button>
        </>
      )}
    </>
  )
}
