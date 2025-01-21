import { useEffect } from 'react';

import wordsData from '../data/words.json';

import useGameStore from '../store/useGameStore';

import supabase from './../config/supabaseClient';

import { getRoomIdFromURL } from '../utils/index';
import Word from '../types/Word';

const normalize = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Ñ/g, 'Ñ');
};

const getRandomWord = (words: string[]) => {
  return words[Math.floor(Math.random() * words.length)];
};

const countLetters = (word: string) => {
  return word.split('').reduce((acc, letter) => {
    acc[letter] = (acc[letter] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
};

const canFormWord = (wordCount: { [key: string]: number }, lettersCount: { [key: string]: number }) => {
  for (const letter in wordCount) {
    if (!lettersCount[letter] || lettersCount[letter] < wordCount[letter]) {
      return false;
    }
  }
  return true;
};

const useRandomWords = () => {
  const { player, setHiddenLetterIndex, setRandomWord, setPossibleWords, level } = useGameStore();

  useEffect(() => {
    if (player && player.role === 'screen') {
      const normalizedWords = Array.from(new Set(wordsData.words.map(normalize)));
      const filteredWords = normalizedWords.filter(word => word.length >= 4 && word.length <= 9);

      let word = getRandomWord(filteredWords);
      let wordCount = countLetters(word);
      let words = filteredWords.filter(w => canFormWord(countLetters(w), wordCount));

      const maxAttempts = 100;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (words.length >= 12 && words.length <= 22) {
          break;
        }
        word = getRandomWord(filteredWords);
        wordCount = countLetters(word);
        words = filteredWords.filter(w => canFormWord(countLetters(w), wordCount));
      }

      words.sort((a, b) => a.length - b.length || a.localeCompare(b));

      setRandomWord(word);
      setPossibleWords(words.map((word: string): Word => ({
        word,
        guessed_by: '',
      })));
      setHiddenLetterIndex(Math.floor(Math.random() * word.length));

      const updateRoomRandomWord = async () => {
        const roomId = getRoomIdFromURL();
        if (roomId) {
          const { error: roomError } = await supabase
            .from('rooms')
            .update({ current_word: word, current_possible_words: [...words] })
            .eq('room', roomId);

          if (roomError) {
            console.error('Error updating currentWord:', roomError);
          }

          const { error: wordsError } = await supabase
            .from('words')
            .insert(words.map(w => ({ word: w, room_id: roomId, original_word: word, level })));

          if (wordsError) {
            console.error('Error inserting possibleWords:', wordsError);
          }
        }
      };

      updateRoomRandomWord();
    }
  }, []);

  return null;
};

export default useRandomWords;
