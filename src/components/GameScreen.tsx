import { useRef, useEffect } from 'react';
import WarningMessage from '../atoms/WarningMessage';
import ScoreContainer from '../atoms/ScoreContainer';
import GameInput from '../atoms/GameInput';
import useGameStore from '../store/useGameStore';
import useProgressBar from './../hooks/useProgressBar';
import useCalculatePoints from './../hooks/useCalculatePoints';
import useShuffledWord from './../hooks/useShuffledWord';
import ShuffledWordObjectType from '../types/ShuffledWordObject';

import {
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  HIDDEN_LETTER_LEVEL_START,
  FAKE_LETTER_LEVEL_START,
  HIDDEN_WORDS_LEVEL_START,
  SHUFFLE_INTERVAL,
  POINTS_PER_LETTER,
  LEVELS_TO_ADVANCE,
  THRESHHOLD
} from '../constant';
import { getRoomIdFromURL } from '../utils/index';
import supabase from './../config/supabaseClient';
import goalSound from '../assets/goal.mp3';

export default function GameScreen() {
  const roomId = getRoomIdFromURL();

  const {
    gameTime,
    player,
    level,
    randomWord,
    possibleWords,
    setTotalPoints,
    setPossibleWords,
    setLastLevelWords,
    setLevel,
    setLevelsToAdvance,
    setLastRoundPoints,
  } = useGameStore();
  const correctWords = possibleWords.filter(word => word.guessed_by);
  const { percentage, timeLeft } = useProgressBar(gameTime);
  const { correctWordsPoints, goalPoints, totalLevelPoints } = useCalculatePoints(possibleWords);
  const shuffledWordObject = useShuffledWord(randomWord, SHUFFLE_INTERVAL, percentage > 0);
  const wordRefs = useRef<(HTMLLIElement | null)[]>([]);

  const handleEndOfLevel = async () => {
    if (correctWordsPoints() >= goalPoints || (totalLevelPoints > 0 && totalLevelPoints === correctWordsPoints() && correctWords.length === correctWords.length)) {
      let levelsAdded = 0;
      const completionPercentage = (correctWordsPoints() / totalLevelPoints) * 100;

      if (completionPercentage === THRESHHOLD.FIVE_STAR) {
        levelsAdded = LEVELS_TO_ADVANCE.FIVE_STAR;
      } else if (completionPercentage >= THRESHHOLD.THREE_STAR) {
        levelsAdded = LEVELS_TO_ADVANCE.THREE_STAR;
      } else if (completionPercentage >= THRESHHOLD.TWO_STAR) {
        levelsAdded = LEVELS_TO_ADVANCE.TWO_STAR;
      } else if (completionPercentage >= THRESHHOLD.ONE_STAR) {
        levelsAdded = LEVELS_TO_ADVANCE.ONE_STAR;
      }
      setLevelsToAdvance(levelsAdded);
      setLevel((prev: number) => prev + levelsAdded);
      setLastRoundPoints(correctWordsPoints());
      setTotalPoints(prev => prev + correctWordsPoints());
      const { error } = await supabase
        .from('room')
        .update({ mode: 'lobby', level: level })
        .eq('room', roomId)

      if (error) {
        console.error('Error updating word:', error);
      }
    } else {
      setTotalPoints(prev => prev + correctWordsPoints());
      supabase
        .from('rooms')
        .update({ mode: 'lost' })
        .eq('room', roomId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating word:', error);
          }
        });
    }
  }

  useEffect(() => {
    if (roomId && randomWord) {
      const channel = supabase
        .channel(`realtime words`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'words',
          }, (payload) => {
            const updatedWords = [...possibleWords];
            const wordToUpdate = updatedWords.find(word => word.word === payload.new.word);
            if (wordToUpdate) {
              wordToUpdate.guessed_by = payload.new.guessed_by;
            }
            setPossibleWords(updatedWords);

            setLastLevelWords(possibleWords.map(word => ({
              word: word.word,
              guessed_by: word.guessed_by,
            })));

          }).subscribe()

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [supabase]);

  useEffect(() => {
    if (percentage === 0 || totalLevelPoints > 0 && possibleWords.length === correctWords.length) {
      handleEndOfLevel();
    }

    if (totalLevelPoints > 0 && correctWordsPoints() >= goalPoints) {
      const audio = new Audio(goalSound);
      audio.play();
    }
  }, [percentage, correctWordsPoints()]);

  return (
    <>
      {(player && player.role === 'screen') ? (
        <>
          <ScoreContainer
            possibleWords={possibleWords}
            goalPoints={goalPoints}
            correctWordsPoints={correctWordsPoints}
            level={level}
          />
          <div className='game__container'>
            <div className="h-section gap-xs">
              <div className="h-section gap-sm">
                <WarningMessage
                  level={level}
                  HIDDEN_LETTER_LEVEL_START={HIDDEN_LETTER_LEVEL_START}
                  FAKE_LETTER_LEVEL_START={FAKE_LETTER_LEVEL_START}
                  HIDDEN_WORDS_LEVEL_START={HIDDEN_WORDS_LEVEL_START}
                />
              </div>
              <div key={shuffledWordObject.map((letter: ShuffledWordObjectType) => letter.letter).join('')} className="selectedWord">
                {shuffledWordObject.map((letter: ShuffledWordObjectType, index: number) => (
                  <span
                    key={`${index}-${letter.letter}`}
                    className={`selectedLetter${letter.isFake && percentage < RUNNING_OUT_OF_TIME_PERCENTAGE ? ' fake' : ''}${letter.isHidden && level >= HIDDEN_LETTER_LEVEL_START ? ' hidden' : ''}`}
                  >
                    {letter.isHidden && level >= HIDDEN_LETTER_LEVEL_START && percentage > RUNNING_OUT_OF_TIME_PERCENTAGE ? '?' : letter.letter}
                    <span className='letterPoints'>{POINTS_PER_LETTER[letter.letter as keyof typeof POINTS_PER_LETTER]}</span>
                  </span>
                ))}
              </div>
              <div className="h-section">
                <div className="progress__time">{Math.floor(timeLeft / 1000)}s</div>
                <div
                  className="progress__container"
                  style={{
                  '--remaining-percentage': `${percentage}%`,
                  '--clr-progress-color': percentage < RUNNING_OUT_OF_TIME_PERCENTAGE ? 'var(--clr-progress-late)' : 'var(--clr-progress-on-time)'
                  } as React.CSSProperties}
                >
                </div>
              </div>
            </div>
            <ul className='wordlist' style={{ '--wordlist-rows': Math.ceil(possibleWords.length / 3) } as React.CSSProperties}>
              {possibleWords.map((word, index) => (
                <li
                  key={`${index}-${word.word}`}
                  className={`word ${word.guessed_by ? 'active' : ''}`}
                  ref={el => wordRefs.current[index] = el}
                >
                  {possibleWords.some(gw => gw.word === word.word && word.guessed_by !== null) && (
                    <span className='player'>{word?.guessed_by}</span>
                  )}
                  <span className='wordLetters'>
                    {word.word.split('').map((letter, letterIndex) => (
                      <span key={`${index}-${word.word}-${letter}-${letterIndex}`} className='letter'>
                        <span>
                          {(level >= HIDDEN_WORDS_LEVEL_START && percentage > RUNNING_OUT_OF_TIME_PERCENTAGE && letterIndex >= 1) ? '?' : letter}
                        </span>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <GameInput
            possibleWords={possibleWords}
            percentage={percentage}
            player={player}
            level={level}
            randomWord={randomWord}
          />
        </>
      )}
    </>
  )
};
