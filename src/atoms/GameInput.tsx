import { useState, useEffect, useRef } from 'react';

import Word from '../types/Word';
import { getRoomIdFromURL } from '../utils/index';

import supabase from './../config/supabaseClient';

import hitMusic from '../assets/hit.mp3';
import Player from '../types/Player';

interface GameInputProps {
  guessedWords: Word[];
  possibleWords: Word[];
  percentage: number;
  player: Player;
  level: number;
  randomWord: string;
  inputRef: React.RefObject<HTMLInputElement>;
}

export default function GameInput({
  guessedWords,
  possibleWords,
  percentage,
  player,
  level,
  randomWord,
  inputRef,
}: GameInputProps) {
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
  }, [guessedWords]);

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

  return (
    <div className='game-input__container'>
      <div className='wordlist' ref={gameInputRef}>
      {inputtedWords.map((word, index) => (
        <li key={`${word.word}-${index}`} className={`word ${guessedWords.some(gw => gw.word === word.word && gw.guessed_by === player.name) ? 'guessed' : 'unguessed'}`}>
          <span className='wordLetters'>
            {word.word.split('').map((letter, letterIndex) => (
              <span key={`${index}-${word.word}-${letter}-${letterIndex}`} className='letter'>
                <span>{letter}</span>
              </span>
            ))}
          </span>
        </li>
      ))}
    </div>
      <div className='h-section w100'>
        <input
          type="text"
          className={`mx-auto mt-auto ${animateError ? 'animate-error' : ''} ${animateSuccess ? 'animate-success' : ''} ${animateRepeated ? 'animate-repeated' : ''}`}
          placeholder='INTRODUCE LA PALABRA...'
          value={inputWord}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={percentage === 0}
          ref={inputRef}
        />
      </div>
    </div>
  );
}
