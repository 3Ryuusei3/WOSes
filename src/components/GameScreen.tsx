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

import useGameStore from '../store/useGameStore';

import { calculateLevelsToAdvance, calculateProbability } from '../utils';
import sql from '../utils/db';

import {
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHOW_LETTERS_RANGE,
  SHUFFLE_INTERVAL,
} from '../constant';

import goalSound from '../assets/goal.mp3';
import revealSound from '../assets/reveal.mp3';
import endSound from '../assets/end.mp3';

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
    setLastLevelWords,
    lastLevelWords,
    gameDifficulty,
  } = useGameStore();

  const showLettersPercentage = calculateProbability(
    level,
    SHOW_LETTERS_RANGE
  );

  const { percentage, timeLeft } = useProgressBar(gameTime);
  const shuffledWordObject = useShuffledWord(randomWord, gameDifficulty, SHUFFLE_INTERVAL, percentage > 0, possibleWords, lastLevelWords);
  const { inputWord, words, correctWords, handleChange, handleKeyDown } = useInputWords(possibleWords);
  const { correctWordsPoints, goalPoints, levelPoints } = useCalculatePoints(possibleWords, correctWords);

  const [hasPlayedGoalSound, setHasPlayedGoalSound] = useState(false);
  const [hasPlayedRevealSound, setHasPlayedRevealSound] = useState(false);
  const [hasPlayedEndSound, setHasPlayedEndSound] = useState(false);

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
      const goalAudio = new Audio(goalSound);
      goalAudio.play();
      setHasPlayedGoalSound(true);
    }

    const anyDifficultyActive = Object.values(gameDifficulty).some(value => value);
    if (anyDifficultyActive && percentage <= showLettersPercentage && !hasPlayedRevealSound) {
      const revealAudio = new Audio(revealSound);
      revealAudio.play();
      setHasPlayedRevealSound(true);
    }

    if (timeLeft <= 3000 && !hasPlayedEndSound) {
      const endAudio = new Audio(endSound);
      endAudio.play();
      setHasPlayedEndSound(true);
    }
  }, [percentage, levelPoints, correctWordsPoints, goalPoints, hasPlayedGoalSound, hasPlayedRevealSound, hasPlayedEndSound]);

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
              gameDifficulty={gameDifficulty}
            />
            <SelectedWord
              shuffledWordObject={shuffledWordObject}
              percentage={percentage}
              gameDifficulty={gameDifficulty}
              SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
            />
          </div>
          <ProgressBar
            timeLeft={timeLeft}
            percentage={percentage}
            RUNNING_OUT_OF_TIME_PERCENTAGE={RUNNING_OUT_OF_TIME_PERCENTAGE}
            SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
          />
        </div>
        <WordList
          words={words}
          playerName={playerName}
          percentage={percentage}
          gameDifficulty={gameDifficulty}
          SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
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
