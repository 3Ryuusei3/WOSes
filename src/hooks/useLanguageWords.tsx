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

const useLanguageWords = (difficulty: Difficulty) => {
  const { i18n } = useTranslation();
  const { dailyChallengeOriginalDifficulty } = useGameStore();

  const getWordsForLanguage = () => {
    let effectiveDifficulty: "easy" | "medium" | "hard";
    if (difficulty === "alex") {
      effectiveDifficulty = "medium";
    } else if (difficulty === "daily") {
      effectiveDifficulty =
        (dailyChallengeOriginalDifficulty as "easy" | "medium" | "hard") ||
        "medium";
    } else {
      effectiveDifficulty = difficulty as "easy" | "medium" | "hard";
    }

    if (i18n.language === "en") {
      return DIFFICULTY_WORDS_EN[effectiveDifficulty].words;
    }
    return DIFFICULTY_WORDS_ES[effectiveDifficulty].words;
  };

  return {
    words: getWordsForLanguage(),
    language: i18n.language,
  };
};

export default useLanguageWords;
