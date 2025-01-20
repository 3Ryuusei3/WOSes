import { useEffect } from 'react';

import GameLogo from '../atoms/GameLogo';

import useGameStore from '../store/useGameStore';

import gameOverSound from '../assets/gameover.mp3';

import supabase from './../config/supabaseClient';

import { getRoomIdFromURL } from '../utils/index';

export default function GameLost() {
  const roomId = getRoomIdFromURL();
  const {
    setMode,
    totalPoints,
    setTotalPoints,
    level,
    setLevel,
    player,
    highestScore,
    setHighestScore,
    lastLevelWords
  } = useGameStore();

  const handleGameStart = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('room')
      .eq('room', roomId);

    if (data) {
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ mode: 'start' })
        .eq('room', roomId);

      if (updateError) {
        console.error('Error:', updateError);
        return;
      }

      setMode('start');
      setTotalPoints(0);
      setLevel(1);
    }
  };

  useEffect(() => {
    if (totalPoints > highestScore.score) {
      setHighestScore({
        name: player.name,
        score: totalPoints
      });
    }

    const audio = new Audio(gameOverSound);
    audio.play();

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [totalPoints, highestScore, setHighestScore]);

  return (
    <>
      {(player && player.role === 'screen') ? (
        <>
          <GameLogo />
          <div className='game__container f-jc-c'>
            <h1 className='lost'>HAS PERDIDO...</h1>
            <h3>HAS ALCANZADO EL NIVEL <span className='highlight'>{level}</span></h3>
            <div className="v-section gap-md mx-auto">
              <div className="h-section gap-md">
                <div className='score__container--box'>
                  <p>TUS PUNTOS TOTALES</p>
                  <h3>{totalPoints}</h3>
                </div>
                <div className='score__container--box'>
                  <p>LA PUNTUACIÓN MÁS ALTA</p>
                  <h3>{highestScore.score}</h3>
                  <h3>{highestScore.name}</h3>
                </div>
              </div>
              <div className="h-section score__container--box">
                <p>ÚLTIMAS PALABRAS</p>
                <div className="h-section score__container--wordlist" style={{ '--wordlist-rows': Math.ceil(lastLevelWords.length / 3) } as React.CSSProperties}>
                  {lastLevelWords.map((word, index) => (
                    <h4 className={`${word.guessed_by ? 'highlight' : 'unguessed'}`} key={`${index}-${word}`}>{word.word.toUpperCase()}</h4>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => {
              setMode('start');
            } }>JUGAR DE NUEVO</button>
          </div>
        </>
      ) : (player && player.role === 'host') ? (
        <>
          <h4 className='highlight'>TU NOMBRE:</h4>
          <h2 className='highlight'>{player.name}</h2>
          <button onClick={handleGameStart}>VOLVER A JUGAR</button>
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
