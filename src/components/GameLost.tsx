import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import TopScores from '../atoms/TopScores';
import Tooltip from '../atoms/Tooltip';
import GameSound from '../atoms/GameSound';
import DifficultyTag from '../atoms/DifficultyTag';

import useGameStore from '../store/useGameStore';
import useWindowSize from '../hooks/useWindowSize';

import gameOverSound from '../assets/gameover.mp3';
import { START_TIME } from '../constant';

export default function GameLost() {
  const { t, i18n } = useTranslation();
  const {
    setMode,
    totalPoints,
    setTotalPoints,
    level,
    setLevel,
    playerName,
    highestScore,
    setHighestScore,
    lastLevelWords,
    setGameMechanics,
    setGameTime,
    setLevelsToAdvance,
    numberOfRounds,
    setNumberOfRounds,
    numberOfPerfectRounds,
    setNumberOfPerfectRounds,
    gameDifficulty,
    volume
  } = useGameStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { columns } = useWindowSize();

  const handlePlayAgain = () => {
    setMode('start');
    setTotalPoints(0);
    setLevel(1);
    setGameMechanics({ fake: false, hidden: false, first: false, dark: false, still: false });
    setGameTime(START_TIME);
    setNumberOfPerfectRounds(0);
    setNumberOfRounds(0);
    setLevelsToAdvance(0)
  };

  const getDictionaryUrl = (word: string) => {
    if (i18n.language === 'en') {
      return `https://www.merriam-webster.com/dictionary/${word.toLowerCase()}`;
    }
    return `https://dle.rae.es/${word}`;
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(gameOverSound);
      audioRef.current.volume = volume;

      audioRef.current.addEventListener('canplaythrough', () => {
        audioRef.current?.play().catch(err => console.error('Audio playback failed:', err));
      }, { once: true });
    }

    if (totalPoints > highestScore.score) {
      setHighestScore({
        name: playerName,
        score: totalPoints
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [totalPoints, highestScore.score, playerName, setHighestScore]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <div className='game__container f-jc-c'>
      <div className="difficulty-tag">
        <DifficultyTag gameDifficulty={gameDifficulty} />
      </div>
      <h1 className='lost'>{t('game.lost')}</h1>
      <div className="h-section gap-md f-jc-c">
        <div className='v-section'>
          <div className='score__container--box score__container--box-sm won'>
            <p>{t('common.reachedLevel')}</p>
            <h3>{level}</h3>
          </div>
        </div>
        <div className='v-section'>
          <div className='score__container--box score__container--box-sm won'>
            <p>{t('common.totalPoints')}</p>
            <h3>{totalPoints}</h3>
          </div>
        </div>
        <div className='v-section'>
          <div className='score__container--box score__container--box-sm won'>
            <p>{t('common.numberOfRounds')}</p>
            <h3>{numberOfRounds}</h3>
          </div>
        </div>
        <div className='v-section'>
          <div className='score__container--box score__container--box-sm won'>
            <p>{t('common.perfectRounds')}</p>
            <h3>{numberOfPerfectRounds}</h3>
          </div>
        </div>
      </div>
      <div className="h-section gap-lg mx-auto">
        <div className="v-section gap-md">
          <div className="v-section score__container--box">
            <Tooltip message={t('game.wordMeaning')}>
              <div className='info-icon'>i</div>
            </Tooltip>
            <p>{t('common.lastWords')}</p>
            <div className="v-section score__container--wordlist" style={{ '--wordlist-rows': Math.ceil(lastLevelWords.length / columns), '--wordlist-columns': columns } as React.CSSProperties}>
              {lastLevelWords.map((word, index) => (
                <h4 className={`${word.guessed ? 'highlight' : 'unguessed'}`} key={`${index}-${word}`}>
                <Link to={getDictionaryUrl(word.word)} target='_blank' rel='noreferrer'>
                  {word.word.toUpperCase()}
                </Link>
              </h4>
              ))}
            </div>
          </div>
        </div>
        <div className="score__container--box pos-rel">
          <TopScores hasTooltip difficulty={gameDifficulty} />
        </div>
      </div>
      <div className="h-section gap-xs f-jc-c mb-sm">
        <button onClick={handlePlayAgain}>{t('common.playAgain')}</button>
      </div>
      <GameSound />
    </div>
  )
}
