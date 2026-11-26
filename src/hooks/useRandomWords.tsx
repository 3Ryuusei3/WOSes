import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import useGameStore from "../store/useGameStore";
import useLanguageWords from "./useLanguageWords";

import Difficulty from "../types/Difficulty";

import { EARLY_LEVELS, getLanguageConstants } from "../constant";

const getRandomWord = (words: string[]) => {
  return words[Math.floor(Math.random() * words.length)];
};

const countLetters = (word: string) => {
  return word.split("").reduce(
    (acc, letter) => {
      acc[letter] = (acc[letter] || 0) + 1;
      return acc;
    },
    {} as { [key: string]: number },
  );
};

const canFormWord = (
  wordCount: { [key: string]: number },
  lettersCount: { [key: string]: number },
) => {
  for (const letter in wordCount) {
    if (!lettersCount[letter] || lettersCount[letter] < wordCount[letter]) {
      return false;
    }
  }
  return true;
};

const hasLetterCombination = (
  word: string,
  combinations: string[],
): boolean => {
  return combinations.some((combo) => word.includes(combo));
};

const hasAnyLetter = (word: string, letters: string[]): boolean => {
  return letters.some((letter) => word.includes(letter));
};

const filterUsedWords = (words: string[], usedWords: string[]): string[] => {
  return words.filter((word) => !usedWords.includes(word.toLowerCase()));
};

const useRandomWords = (
  difficulty: Difficulty = "hard",
  skipGeneration: boolean = false,
) => {
  const { i18n } = useTranslation();
  const {
    setRandomWord,
    setPossibleWords,
    level,
    setHiddenLetterIndex,
    previousRoundsWords,
    dailyChallengeWord,
    dailyChallengeOriginalDifficulty,
    players,
    role,
  } = useGameStore();
  const { words, easyWords } = useLanguageWords(difficulty);

  useEffect(() => {
    if (words && words.length > 0) {
      if (players === "multi" && role === "player") {
        return;
      }

      if (skipGeneration) {
        return;
      }

      if (difficulty === "daily") {
        if (!dailyChallengeWord || !dailyChallengeOriginalDifficulty) {
          return;
        }

        const word = dailyChallengeWord;
        const wordCount = countLetters(word);
        const filteredWords = words.filter(
          (w) => w.length >= 4 && w.length <= 9,
        );
        const possibleWordsList = filteredWords.filter((w) =>
          canFormWord(countLetters(w), wordCount),
        );

        possibleWordsList.sort(
          (a, b) => a.length - b.length || a.localeCompare(b),
        );

        setRandomWord(word);
        setPossibleWords(possibleWordsList);
        setHiddenLetterIndex(Math.floor(Math.random() * word.length));
        return;
      }

      // Lógica normal para dificultades estándar
      const { WORD_LEVEL_RANGES, RARE_LETTERS } = getLanguageConstants(
        i18n.language,
      );
      const filteredWords = words.filter(
        (word) => word.length >= 4 && word.length <= 9,
      );
      const availableWords = filterUsedWords(
        filteredWords,
        previousRoundsWords,
      );
      const wordsToUse =
        availableWords.length >= 5 ? availableWords : filteredWords;

      const easySet = new Set(easyWords);
      const rareCount = (w: string) =>
        w.split("").filter((l) => RARE_LETTERS.includes(l)).length;

      // Board words allowed at this level (letters and length)
      const fitsLevel = (w: string, strict: boolean): boolean => {
        const upper = w.toUpperCase();
        if (
          level >= WORD_LEVEL_RANGES.START.MIN &&
          level <= WORD_LEVEL_RANGES.START.MAX &&
          !hasLetterCombination(upper, WORD_LEVEL_RANGES.START.LETTERS)
        )
          return false;
        if (
          level >= WORD_LEVEL_RANGES.MID.MIN &&
          level <= WORD_LEVEL_RANGES.MID.MAX &&
          !hasAnyLetter(upper, WORD_LEVEL_RANGES.MID.LETTERS)
        )
          return false;
        if (!strict) return true;
        if (level <= EARLY_LEVELS.WARMUP.MAX) {
          return (
            w.length >= EARLY_LEVELS.WARMUP.MIN_LEN &&
            w.length <= EARLY_LEVELS.WARMUP.MAX_LEN &&
            rareCount(w) === 0 &&
            // The board word itself a common one too
            easySet.has(w)
          );
        }
        if (level <= EARLY_LEVELS.EARLY.MAX) {
          return (
            w.length <= EARLY_LEVELS.EARLY.MAX_LEN &&
            rareCount(w) <= EARLY_LEVELS.EARLY.MAX_RARE
          );
        }
        return true;
      };

      // Letter counts worked out once (each attempt checks the whole list)
      const wordCounts = wordsToUse.map(countLetters);
      const possibleFor = (base: string) => {
        const count = countLetters(base);
        return wordsToUse.filter(
          (w, i) => w.length <= base.length && canFormWord(wordCounts[i], count),
        );
      };
      // 12–22 words to find; in the warm-up most of them common ones
      const isGoodBoard = (list: string[], checkEasy: boolean) => {
        if (list.length < 12 || list.length > 22) return false;
        if (!checkEasy) return true;
        const easyShare =
          list.filter((w) => easySet.has(w)).length / list.length;
        return easyShare >= EARLY_LEVELS.WARMUP.MIN_EASY_SHARE;
      };

      const pick = (
        candidates: string[],
        checkEasy: boolean,
        attempts: number,
      ) => {
        for (let i = 0; i < attempts && candidates.length > 0; i++) {
          const base = getRandomWord(candidates);
          const list = possibleFor(base);
          if (isGoodBoard(list, checkEasy)) return { base, list };
        }
        return null;
      };

      // Strictest first; if nothing fits, relax step by step (never stuck)
      const strict = wordsToUse.filter((w) => fitsLevel(w, true));
      const loose = wordsToUse.filter((w) => fitsLevel(w, false));
      const isWarmup = level <= EARLY_LEVELS.WARMUP.MAX;
      const chosen =
        pick(strict, isWarmup, 120) ??
        (isWarmup ? pick(strict, false, 60) : null) ??
        pick(loose.length ? loose : wordsToUse, false, 100);

      let word: string;
      let possibleWordsList: string[];
      if (chosen) {
        word = chosen.base;
        possibleWordsList = chosen.list;
      } else {
        word = getRandomWord(strict.length ? strict : wordsToUse);
        possibleWordsList = possibleFor(word);
      }

      possibleWordsList.sort(
        (a, b) => a.length - b.length || a.localeCompare(b),
      );

      setRandomWord(word);
      setPossibleWords(possibleWordsList);
      setHiddenLetterIndex(Math.floor(Math.random() * word.length));
    }
  }, [
    words,
    easyWords,
    level,
    setRandomWord,
    setPossibleWords,
    setHiddenLetterIndex,
    difficulty,
    i18n.language,
    previousRoundsWords,
    dailyChallengeWord,
    dailyChallengeOriginalDifficulty,
    players,
    role,
    skipGeneration,
  ]);
};

export default useRandomWords;
