import { useTranslation } from "react-i18next";

import hardWordsDataEs from "../data/hard.json";
import mediumWordsDataEs from "../data/medium.json";
import easyWordsDataEs from "../data/easy.json";
import wordsDataEn from "../data/en.json";

import Difficulty from "../types/Difficulty";
import useGameStore from "../store/useGameStore";

const DIFFICULTY_WORDS_ES = {
  easy: easyWordsDataEs,
  medium: mediumWordsDataEs,
  hard: hardWordsDataEs,
};

const DIFFICULTY_WORDS_EN = {
  easy: wordsDataEn,
  medium: wordsDataEn,
  hard: wordsDataEn,
};

type WordsDifficulty = keyof typeof DIFFICULTY_WORDS_ES;

const isWordsDifficulty = (value: unknown): value is WordsDifficulty =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(DIFFICULTY_WORDS_ES, value);

const useLanguageWords = (difficulty: Difficulty) => {
  const { i18n } = useTranslation();
  const { dailyChallengeOriginalDifficulty } = useGameStore();

  const getWordsForLanguage = () => {
    const requested =
      difficulty === "daily" ? dailyChallengeOriginalDifficulty : difficulty;
    // Unknown values (old saved state, a room or daily challenge with another
    // name) fall back to medium instead of crashing the whole page
    const effectiveDifficulty: WordsDifficulty = isWordsDifficulty(requested)
      ? requested
      : "medium";

    const table = i18n.language === "en" ? DIFFICULTY_WORDS_EN : DIFFICULTY_WORDS_ES;
    return table[effectiveDifficulty].words;
  };

  return {
    words: getWordsForLanguage(),
    // Estándar list (most common words): the first levels lean on it
    easyWords: (i18n.language === "en" ? DIFFICULTY_WORDS_EN : DIFFICULTY_WORDS_ES)
      .easy.words,
    language: i18n.language,
  };
};

export default useLanguageWords;
