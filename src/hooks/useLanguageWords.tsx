import { useTranslation } from 'react-i18next';

import hardWordsDataEs from '../data/hard.json';
import mediumWordsDataEs from '../data/medium.json';
import easyWordsDataEs from '../data/easy.json';
import wordsDataEn from '../data/en.json';

import Difficulty from '../types/Difficulty';

const DIFFICULTY_WORDS_ES = {
  easy: easyWordsDataEs,
  medium: mediumWordsDataEs,
  hard: hardWordsDataEs
};

const DIFFICULTY_WORDS_EN = {
  easy: wordsDataEn,
  medium: wordsDataEn,
  hard: wordsDataEn
};

const useLanguageWords = (difficulty: Difficulty) => {
  const { i18n } = useTranslation();

  const getWordsForLanguage = () => {
    if (i18n.language === 'en') {
      return DIFFICULTY_WORDS_EN[difficulty].words;
    }
    return DIFFICULTY_WORDS_ES[difficulty].words;
  };

  return {
    words: getWordsForLanguage(),
    language: i18n.language
  };
};

export default useLanguageWords;
