import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
import { insertScoreWithNextId } from '../services/rooms';

import {
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHOW_LETTERS_RANGE,
  SHUFFLE_INTERVAL,
} from '../constant';

import goalSound from '../assets/goal.mp3';
import revealSound from '../assets/reveal.mp3';
import endSound from '../assets/end.mp3';
import GameSound from '../atoms/GameSound';

export default function GameScreen() {
  const { i18n } = useTranslation();
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
    levelsToAdvance,
    setLevelsToAdvance,
    setLastLevelWords,
    lastLevelWords,
    gameMechanics,
    gameDifficulty,
    volume,
    numberOfRounds,
    numberOfPerfectRounds
  } = useGameStore();

  const showLettersPercentage = calculateProbability(
    level,
    SHOW_LETTERS_RANGE
  );

  const { percentage, timeLeft } = useProgressBar(gameTime);
  const shuffledWordObject = useShuffledWord(randomWord, gameMechanics, SHUFFLE_INTERVAL, percentage > 0, possibleWords, lastLevelWords, levelsToAdvance, volume);
  const { inputWord, words, correctWords, handleChange, handleKeyDown } = useInputWords(possibleWords);
  const { correctWordsPoints, goalPoints, levelPoints } = useCalculatePoints(possibleWords, correctWords);

  const [hasPlayedGoalSound, setHasPlayedGoalSound] = useState(false);
  const [hasPlayedRevealSound, setHasPlayedRevealSound] = useState(false);
  const [hasPlayedEndSound, setHasPlayedEndSound] = useState(false);

  const goalAudioRef = useRef<HTMLAudioElement | null>(null);
  const revealAudioRef = useRef<HTMLAudioElement | null>(null);
  const endAudioRef = useRef<HTMLAudioElement | null>(null);

  const updateLastLevelWordsAndPoints = useCallback(() => {
    setTotalPoints(prev => prev + correctWordsPoints());
    setLastLevelWords(words);
  }, [correctWordsPoints, setTotalPoints, setLastLevelWords, words]);

  const updateHighscoreDB = useCallback(async (finalPoints: number) => {
    try {
      const createdAt = new Date().toISOString();
      const language = i18n.language;
      const { error } = await insertScoreWithNextId(playerName, finalPoints, level, gameDifficulty, language, createdAt, numberOfRounds, numberOfPerfectRounds);
      if (error) throw error;
    } catch (error) {
      console.error('Error inserting highscore:', error);
    }
  }, [playerName, level, gameDifficulty, i18n.language, numberOfRounds, numberOfPerfectRounds]);

  const hasCompletedLevel = useCallback(() => {
    return correctWordsPoints() >= goalPoints ||
           (levelPoints > 0 &&
            levelPoints === correctWordsPoints() &&
            correctWords.length === possibleWords.length);
  }, [correctWordsPoints, goalPoints, levelPoints, correctWords.length, possibleWords.length]);

  const advanceToNextLevel = useCallback((levelsAdded: number) => {
    setLevelsToAdvance(levelsAdded);
    setLevel((prev: number) => prev + levelsAdded);
    setLastRoundPoints(correctWordsPoints());
    updateLastLevelWordsAndPoints();
    setMode('lobby');
  }, [setLevelsToAdvance, setLevel, setLastRoundPoints, correctWordsPoints, updateLastLevelWordsAndPoints, setMode]);

  const endGameAndSaveScore = useCallback((finalPoints: number) => {
    updateLastLevelWordsAndPoints();
    updateHighscoreDB(finalPoints);
    setMode('lost');
  }, [updateLastLevelWordsAndPoints, updateHighscoreDB, setMode]);

  const handleEndOfLevel = useCallback(() => {
    const finalPoints = totalPoints + correctWordsPoints();

    if (hasCompletedLevel()) {
      const completionPercentage = (correctWordsPoints() / levelPoints) * 100;
      const levelsAdded = calculateLevelsToAdvance(completionPercentage);
      advanceToNextLevel(levelsAdded);
    } else {
      endGameAndSaveScore(finalPoints);
    }
  }, [totalPoints, correctWordsPoints, hasCompletedLevel, levelPoints, advanceToNextLevel, endGameAndSaveScore]);

  useEffect(() => {
    if (!goalAudioRef.current) {
      goalAudioRef.current = new Audio(goalSound);
    }
    if (!revealAudioRef.current) {
      revealAudioRef.current = new Audio(revealSound);
    }
    if (!endAudioRef.current) {
      endAudioRef.current = new Audio(endSound);
    }

    return () => {
      if (goalAudioRef.current) {
        goalAudioRef.current.pause();
        goalAudioRef.current.currentTime = 0;
      }
      if (revealAudioRef.current) {
        revealAudioRef.current.pause();
        revealAudioRef.current.currentTime = 0;
      }
      if (endAudioRef.current) {
        endAudioRef.current.pause();
        endAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (goalAudioRef.current) {
      goalAudioRef.current.volume = volume;
    }
    if (revealAudioRef.current) {
      revealAudioRef.current.volume = volume;
    }
    if (endAudioRef.current) {
      endAudioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (percentage === 0 ||
      levelPoints > 0 && correctWords.length === possibleWords.length) {
      handleEndOfLevel();
    }

    if (levelPoints > 0 && correctWordsPoints() >= goalPoints && !hasPlayedGoalSound) {
      if (goalAudioRef.current) {
        goalAudioRef.current.currentTime = 0;
        goalAudioRef.current.play().catch(() => {});
      }
      setHasPlayedGoalSound(true);
    }

    const anyMechanicsActive = Object.values(gameMechanics).some(value => value);
    if (anyMechanicsActive && percentage <= showLettersPercentage && !hasPlayedRevealSound) {
      if (revealAudioRef.current) {
        revealAudioRef.current.currentTime = 0;
        revealAudioRef.current.play().catch(() => {});
      }
      setHasPlayedRevealSound(true);
    }

    if (timeLeft <= 3000 && !hasPlayedEndSound) {
      if (endAudioRef.current) {
        endAudioRef.current.currentTime = 0;
        endAudioRef.current.play().catch(() => {});
      }
      setHasPlayedEndSound(true);
    }
  }, [
    percentage,
    levelPoints,
    correctWordsPoints,
    goalPoints,
    hasPlayedGoalSound,
    hasPlayedRevealSound,
    hasPlayedEndSound,
    showLettersPercentage,
    timeLeft,
    correctWords.length,
    possibleWords.length,
    gameMechanics,
    handleEndOfLevel
  ]);

  return (
    <>
      <ScoreContainer
        words={words}
        correctWordsPoints={correctWordsPoints}
        goalPoints={goalPoints}
        level={level}
        gameDifficulty={gameDifficulty}
      />
      <div className='game__container'>
        <div className="v-section gap-xs">
          <div className="v-section gap-sm">
            <WarningMessage
              gameMechanics={gameMechanics}
            />
            <SelectedWord
              shuffledWordObject={shuffledWordObject}
              percentage={percentage}
              gameMechanics={gameMechanics}
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
          gameMechanics={gameMechanics}
          SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
        />
        <WordInput
          inputWord={inputWord}
          handleChange={handleChange}
          handleKeyDown={handleKeyDown}
          possibleWords={possibleWords}
          correctWords={correctWords}
          percentage={percentage}
          volume={volume}
        />
        <GameSound />
      </div>
    </>
  )
}
