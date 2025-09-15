import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  getLanguageConstants,
} from '../constant';

import hitSound from '../assets/hit.mp3';
import revealSound from '../assets/reveal.mp3';
import endSound from '../assets/end.mp3';
import GameSound from '../atoms/GameSound';
import { subscribeToCorrectWords, getCorrectWords, submitWord, getPlayerNameById, finishRoundToLobby, finishRoundToLost, getLatestRoundId, getCorrectCountForRound } from '../services/multiplayer';

export default function GameScreen() {
  const { t, i18n } = useTranslation();
  const {
    mode,
    playerName,
    role,
    players,
    roomCode,
    roomId,
    playerId,
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
    numberOfPerfectRounds,
    setPreviousRoundsWords
  } = useGameStore();

  const isPlayer = players === 'multi' && role === 'player';
  const effectiveVolume = isPlayer ? 0 : volume;

  const showLettersPercentage = calculateProbability(
    level,
    SHOW_LETTERS_RANGE
  );

  const { percentage, timeLeft } = useProgressBar(gameTime);
  const shuffledWordObject = useShuffledWord(randomWord, gameMechanics, SHUFFLE_INTERVAL, percentage > 0, possibleWords, lastLevelWords, levelsToAdvance, effectiveVolume);
  const { inputWord, words, correctWords, handleChange, handleKeyDown, markWordGuessed, clearInput } = useInputWords(possibleWords);
  const { correctWordsPoints, goalPoints, levelPoints } = useCalculatePoints(possibleWords, correctWords);

  const [hasPlayedGoalSound, setHasPlayedGoalSound] = useState(false);
  const [hasPlayedRevealSound, setHasPlayedRevealSound] = useState(false);
  const [hasPlayedEndSound, setHasPlayedEndSound] = useState(false);
  const [playerAttempts, setPlayerAttempts] = useState<{ word: string; status: 'pending' | 'correct' | 'invalid' | 'rejected' | 'tip' }[]>([]);
  const wordsChannelRef = useRef<ReturnType<typeof subscribeToCorrectWords> | null>(null);
  const markWordGuessedRef = useRef(markWordGuessed);
  const currentRoundIdRef = useRef<number | null>(null);
  const hostPrevGuessedRef = useRef<number>(0);

  const playerRoundPoints = useMemo(() => {
    const { POINTS_PER_LETTER } = getLanguageConstants(i18n.language);
    return playerAttempts
      .filter(at => at.status === 'correct')
      .reduce((sum, it) => sum + it.word.split('').reduce((acc, letter) => acc + POINTS_PER_LETTER[letter as keyof typeof POINTS_PER_LETTER], 0), 0);
  }, [playerAttempts, i18n.language]);

  useEffect(() => {
    markWordGuessedRef.current = markWordGuessed;
  }, [markWordGuessed]);

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
    setPreviousRoundsWords((prevWords) => [...prevWords, randomWord]);
  }, [setLevelsToAdvance, setLevel, setLastRoundPoints, correctWordsPoints, updateLastLevelWordsAndPoints, setMode, randomWord]);

  const endGameAndSaveScore = useCallback((finalPoints: number) => {
    updateLastLevelWordsAndPoints();
    // Solo singleplayer inserta score en la tabla de TopScores
    if (players === 'single') {
      updateHighscoreDB(finalPoints);
    }
    setMode('lost');
    setPreviousRoundsWords([]);
  }, [updateLastLevelWordsAndPoints, updateHighscoreDB, setMode, players]);

  const handleEndOfLevel = useCallback(() => {
    const finalPoints = totalPoints + correctWordsPoints();

    if (hasCompletedLevel()) {
      const completionPercentage = (correctWordsPoints() / levelPoints) * 100;
      const levelsAdded = calculateLevelsToAdvance(completionPercentage);
      advanceToNextLevel(levelsAdded);
      // Multiplayer: host mueve a lobby en BBDD y todos siguen por realtime
      if (players === 'multi' && role === 'host' && roomCode) {
        finishRoundToLobby(roomCode);
      }
    } else {
      endGameAndSaveScore(finalPoints);
      if (players === 'multi' && role === 'host' && roomCode) {
        // En multiplayer no insertamos en TopScores; solo actualizamos room a 'lost'
        finishRoundToLost(roomCode);
      }
    }
  }, [totalPoints, correctWordsPoints, hasCompletedLevel, levelPoints, advanceToNextLevel, endGameAndSaveScore]);

  useEffect(() => {
    if (!goalAudioRef.current) {
      goalAudioRef.current = new Audio(hitSound);
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
      goalAudioRef.current.volume = effectiveVolume;
    }
    if (revealAudioRef.current) {
      revealAudioRef.current.volume = effectiveVolume;
    }
    if (endAudioRef.current) {
      endAudioRef.current.volume = effectiveVolume;
    }
  }, [effectiveVolume]);

  // Host: play a short success sound whenever a new word gets revealed
  useEffect(() => {
    if (players === 'multi' && role === 'host') {
      const guessedCount = words.filter(w => w.guessed).length;
      if (guessedCount > hostPrevGuessedRef.current) {
        if (goalAudioRef.current && effectiveVolume > 0) {
          try {
            goalAudioRef.current.currentTime = 0;
            goalAudioRef.current.play().catch(() => {});
          } catch (_) {}
        }
      }
      hostPrevGuessedRef.current = guessedCount;
    }
  }, [words, players, role, effectiveVolume]);

  // Suscripción a correct words para la ronda actual únicamente
  useEffect(() => {
    (async () => {
      if (roomId && !wordsChannelRef.current) {
        const { data: currentRoundId } = await getLatestRoundId(roomId);
        currentRoundIdRef.current = currentRoundId ?? null;
        // Carga inicial solo de la ronda actual
        if (currentRoundIdRef.current) {
          const { data } = await getCorrectWords(roomId, currentRoundIdRef.current);
          if (data) {
            for (const row of data as any[]) {
              if (row.status === 'correct' && row.round_id === currentRoundIdRef.current) {
                const name = row.room_players?.name || '';
                markWordGuessedRef.current(row.word, name);
              }
            }
          }
        }
        // Suscripción global, pero filtramos por round_id en handler
        wordsChannelRef.current = subscribeToCorrectWords(roomId, async (payload: any) => {
          const newRow = payload.new;
          if (newRow && newRow.status === 'correct' && newRow.round_id === currentRoundIdRef.current) {
            let name = '';
            if (newRow.player_id) {
              const { data } = await getPlayerNameById(newRow.player_id);
              name = (data as any)?.name || '';
            }
            // Host: play success sound immediately on new correct
            const state = useGameStore.getState();
            if (state.players === 'multi' && state.role === 'host') {
              if (!goalAudioRef.current) {
                goalAudioRef.current = new Audio(hitSound);
              }
              if (goalAudioRef.current && effectiveVolume > 0) {
                try {
                  goalAudioRef.current.currentTime = 0;
                  await goalAudioRef.current.play();
                } catch (_) {}
              }
            }
            markWordGuessedRef.current(newRow.word, name);
          }
        });
      }
    })();
    return () => {
      if (wordsChannelRef.current) {
        wordsChannelRef.current.unsubscribe();
        wordsChannelRef.current = null;
      }
    };
  }, [roomId]);

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

  // Extra fallback: if server correct count equals possible words, move to lobby (players)
  useEffect(() => {
    if (players === 'multi' && role !== 'host' && roomId && possibleWords.length > 0) {
      (async () => {
        const { data: roundId } = await getLatestRoundId(roomId);
        if (!roundId) return;
        const { data: correctCount } = await getCorrectCountForRound(roomId, roundId);
        if (correctCount !== null && correctCount >= possibleWords.length) {
          setMode('lobby');
        }
      })();
    }
  }, [players, role, roomId, possibleWords.length, setMode]);

  // Fallback: if time ends and server doesn't broadcast, force non-host players to lobby after a short delay
  useEffect(() => {
    if (players === 'multi' && role !== 'host' && percentage === 0) {
      const t = setTimeout(() => {
        if (mode === 'game') {
          setMode('lobby');
        }
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [players, role, percentage, mode, setMode]);

  return (
    <>
      {players === 'multi' && role === 'player' ? (
        <div className='game__container'>
          <div className="h-section gap-xs">
            <button className="btn btn--deco btn--xs">{t('common.points')} {playerRoundPoints}</button>
          </div>
          <div className="v-section gap-sm w100 f-jc-c">
            <input
              type="text"
              className='mx-auto mt-auto'
              placeholder='INTRODUCE LA PALABRA...'
              value={inputWord}
              onChange={handleChange}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && inputWord.trim() !== '') {
                  const attempt = inputWord.trim().toLowerCase();
                  if (attempt.length < 4) {
                    // No cuenta: no se envía ni se añade a la lista
                    clearInput();
                    return;
                  }
                  const isValid = possibleWords.includes(attempt);
                  const localWord = attempt;
                  clearInput();
                  // Si ya está resuelta globalmente (acertada por alguien), mostrar "tip" y no enviar
                  const alreadySolvedGlobally = words.some(w => w.word === localWord && w.guessed);
                  if (alreadySolvedGlobally) {
                    setPlayerAttempts(prev => [{ word: localWord, status: 'tip' as any }, ...prev]);
                    return;
                  }

                  if (!isValid) {
                    setPlayerAttempts(prev => [{ word: localWord, status: 'invalid' }, ...prev]);
                  } else if (isValid && playerId && roomCode) {
                    setPlayerAttempts(prev => [{ word: localWord, status: 'pending' }, ...prev]);
                    const { data, error } = await submitWord(roomCode, playerId, localWord, true);
                    if (!error && data && (data as any).status === 'correct') {
                      // Colorea como correcta en la lista del player y en el tablero global por suscripción del host
                      setPlayerAttempts(prev => prev.map(it => it.word === localWord ? { ...it, status: 'correct' } : it));
                      markWordGuessed(localWord);
                    } else {
                      setPlayerAttempts(prev => prev.map(it => it.word === localWord ? { ...it, status: 'rejected' } : it));
                    }
                  }
                }
              }}
              disabled={percentage === 0}
            />
            <div className='attemptList'>
              {playerAttempts.map((it, idx) => (
                <h4 key={`${idx}-${it.word}`} className={`${it.status === 'correct' ? 'highlight' : it.status === 'tip' ? 'tip' : 'dark'} txt-center`}>
                  {it.word.toUpperCase()}
                </h4>
              ))}
            </div>
            {/* GameSound hidden for players */}
          </div>
        </div>
      ) : (
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
            {players === 'single' && (
              <WordInput
                inputWord={inputWord}
                handleChange={handleChange}
                handleKeyDown={handleKeyDown}
                possibleWords={possibleWords}
                correctWords={correctWords}
                percentage={percentage}
                volume={volume}
              />
            )}
            <GameSound />
          </div>
        </>
      )}
    </>
  )
}
