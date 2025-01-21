import { useState, useEffect, useRef } from 'react';
import Word from '../types/Word';
import { getRoomIdFromURL } from '../utils/index';
import supabase from './../config/supabaseClient';
import hitMusic from '../assets/hit.mp3';
import Player from '../types/Player';

interface UseGameInputProps {
  possibleWords: Word[];
  player: Player;
  level: number;
  randomWord: string;
}

export function useGameInput({ possibleWords, player, level, randomWord }: UseGameInputProps) {
  const roomId = getRoomIdFromURL();
  const [inputWord, setInputWord] = useState('');
  const [inputtedWords, setInputtedWords] = useState<Word[]>([]);
  const [animateError, setAnimateError] = useState(false);
  const [animateSuccess, setAnimateSuccess] = useState(false);
  const [animateRepeated, setAnimateRepeated] = useState(false);

  const gameInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameInputRef.current) {
      gameInputRef.current.scrollTop = gameInputRef.current.scrollHeight;
    }
  }, [inputtedWords]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(e.target.value.toLowerCase());
  };

  const playHitAudio = () => {
    const audio = new Audio(hitMusic);
    audio.volume = 0.5;
    audio.play();
    return audio;
  };

  const triggerAnimateError = () => {
    setAnimateError(true);
    setTimeout(() => setAnimateError(false), 500);
  };

  const triggerAnimateSuccess = () => {
    setAnimateSuccess(true);
    const audio = playHitAudio();
    setTimeout(() => {
      setAnimateSuccess(false);
      audio.pause();
      audio.currentTime = 0;
    }, 500);
  };

  const triggerAnimateRepeated = () => {
    setAnimateRepeated(true);
    setTimeout(() => setAnimateRepeated(false), 500);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputWord.trim() !== '') {
      const trimmedWord = inputWord.trim();
      const wordObject: Word = { word: trimmedWord, guessed_by: player.name };

      setInputtedWords([...inputtedWords, wordObject]);
      if (!possibleWords.some(word => word.word === trimmedWord)) {
        triggerAnimateError();
      } else if (possibleWords.some(word => word.word === trimmedWord && word.guessed_by !== null)) {
        triggerAnimateRepeated();
      } else if (possibleWords.some(word => word.word === trimmedWord && word.guessed_by === null)) {
        triggerAnimateSuccess();

        const { error } = await supabase
          .from('words')
          .update({ guessed_by: player.name })
          .eq('level', level)
          .eq('room_id', roomId)
          .eq('original_word', randomWord)
          .eq('word', trimmedWord);

        if (error) {
          console.error('Error updating word:', error);
        }
      }
      setInputWord('');
    }
    console.log('inputtedWords', inputtedWords);
  };

  return {
    inputWord,
    inputtedWords,
    animateError,
    animateSuccess,
    animateRepeated,
    gameInputRef,
    handleChange,
    handleKeyDown,
    playHitAudio,
  };
}
