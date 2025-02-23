import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import ScoreContainer from '../atoms/ScoreContainer';
import WordInput from '../atoms/WordInput';
import WarningMessage from '../atoms/WarningMessage';
import WordList from '../atoms/WordList';
import ProgressBar from '../atoms/ProgressBar';
import SelectedWord from '../atoms/SelectedWord';

import useShuffledWord from './../hooks/useShuffledWord';
import useInputWords from './../hooks/useInputWords';
import useProgressBar from './../hooks/useProgressBar';
import useCalculatePoints from './../hooks/useCalculatePoints';

import { calculateLevelsToAdvance } from '../utils';

import useGameStore from '../store/useGameStore';

import {
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHOW_LETTERS_PERCENTAGE,
  SHUFFLE_INTERVAL,
  FAKE_LETTER_LEVEL_START,
  HIDDEN_LETTER_LEVEL_START,
  HIDDEN_WORDS_LEVEL_START,
} from '../constant';

import sql from '../utils/db';

import goalSound from '../assets/goal.mp3';

export default function GameScreen() {
  const {
    playerName,
    setMode,
    gameTime,
    randomWord,
    possibleWords,
    totalPoints,
    setTotalPoints,
    setLastRoundPoints,
    level,
    setLevel,
    setLevelsToAdvance,
    setLastLevelWords
  } = useGameStore();
  const { percentage, timeLeft } = useProgressBar(gameTime);
  const shuffledWordObject = useShuffledWord(randomWord, SHUFFLE_INTERVAL, percentage > 0);
  const { inputWord, words, correctWords, handleChange, handleKeyDown } = useInputWords(possibleWords);
  const { correctWordsPoints, goalPoints, levelPoints } = useCalculatePoints(possibleWords, correctWords);
  const [hasPlayedGoalSound, setHasPlayedGoalSound] = useState(false);

  const updateLastLevelWordsAndPoints = () => {
    setTotalPoints(prev => prev + correctWordsPoints());
    setLastLevelWords(words);
  };

  const updateHighscoreDB = async (finalPoints: number) => {
    try {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      await sql`INSERT INTO scores (id, name, score, level, created_at) VALUES (${id}, ${playerName}, ${finalPoints}, ${level}, ${createdAt})`;
    } catch (error) {
      console.error('Error inserting highscore:', error);
    }
  }

  const hasCompletedLevel = () => {
    return correctWordsPoints() >= goalPoints ||
           (levelPoints > 0 &&
            levelPoints === correctWordsPoints() &&
            correctWords.length === possibleWords.length);
  };

  const advanceToNextLevel = (levelsAdded: number) => {
    setLevelsToAdvance(levelsAdded);
    setLevel((prev: number) => prev + levelsAdded);
    setLastRoundPoints(correctWordsPoints());
    updateLastLevelWordsAndPoints();
    setMode('lobby');
  };

  const endGameAndSaveScore = (finalPoints: number) => {
    updateLastLevelWordsAndPoints();
    updateHighscoreDB(finalPoints);
    setMode('lost');
  };

  const handleEndOfLevel = () => {
    const finalPoints = totalPoints + correctWordsPoints();

    if (hasCompletedLevel()) {
      const completionPercentage = (correctWordsPoints() / levelPoints) * 100;
      const levelsAdded = calculateLevelsToAdvance(completionPercentage);
      advanceToNextLevel(levelsAdded);
    } else {
      endGameAndSaveScore(finalPoints);
    }
  };

  useEffect(() => {
    if (percentage === 0 ||
      levelPoints > 0 && correctWords.length === possibleWords.length) {
      handleEndOfLevel();
    }

    if (levelPoints > 0 && correctWordsPoints() >= goalPoints && !hasPlayedGoalSound) {
      const audio = new Audio(goalSound);
      audio.play();
      setHasPlayedGoalSound(true);
    }
  }, [percentage, levelPoints, correctWordsPoints, goalPoints, hasPlayedGoalSound]);

  return (
    <>
      <ScoreContainer
        words={words}
        correctWordsPoints={correctWordsPoints}
        goalPoints={goalPoints}
        level={level}
      />
      <div className='game__container'>
        <div className="v-section gap-xs">
          <div className="v-section gap-sm">
            <WarningMessage
              level={level}
              HIDDEN_LETTER_LEVEL_START={HIDDEN_LETTER_LEVEL_START}
              FAKE_LETTER_LEVEL_START={FAKE_LETTER_LEVEL_START}
              HIDDEN_WORDS_LEVEL_START={HIDDEN_WORDS_LEVEL_START}
            />
            <SelectedWord
              shuffledWordObject={shuffledWordObject}
              level={level}
              percentage={percentage}
              SHOW_LETTERS_PERCENTAGE={SHOW_LETTERS_PERCENTAGE}
              HIDDEN_LETTER_LEVEL_START={HIDDEN_LETTER_LEVEL_START}
            />
          </div>
          <ProgressBar
            timeLeft={timeLeft}
            percentage={percentage}
            RUNNING_OUT_OF_TIME_PERCENTAGE={RUNNING_OUT_OF_TIME_PERCENTAGE}
          />
        </div>
        <WordList
          words={words}
          playerName={playerName}
          level={level}
          percentage={percentage}
          HIDDEN_WORDS_LEVEL_START={HIDDEN_WORDS_LEVEL_START}
          SHOW_LETTERS_PERCENTAGE={SHOW_LETTERS_PERCENTAGE}
        />
        <WordInput
          inputWord={inputWord}
          handleChange={handleChange}
          handleKeyDown={handleKeyDown}
          possibleWords={possibleWords}
          correctWords={correctWords}
          percentage={percentage}
        />
      </div>
    </>
  )
}
