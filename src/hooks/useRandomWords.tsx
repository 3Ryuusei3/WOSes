import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import useGameStore from "../store/useGameStore";
import useLanguageWords from "./useLanguageWords";

import Difficulty from "../types/Difficulty";

import { getLanguageConstants } from "../constant";

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

const useRandomWords = (difficulty: Difficulty = "hard", skipGeneration: boolean = false) => {
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
  const { words } = useLanguageWords(difficulty);

  useEffect(() => {
    if (words && words.length > 0) {
      // En multiplayer, solo el player NO debe generar palabras
      // El host necesita generar la palabra inicial
      // Si skipGeneration es true, no generar (útil para GameLoading en multiplayer)
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
      const { WORD_LEVEL_RANGES } = getLanguageConstants(i18n.language);
      const filteredWords = words.filter(
        (word) => word.length >= 4 && word.length <= 9,
      );
      const availableWords = filterUsedWords(
        filteredWords,
        previousRoundsWords,
      );

      const getWordBasedOnLevel = (words: string[]): string => {
        if (
          level >= WORD_LEVEL_RANGES.START.MIN &&
          level <= WORD_LEVEL_RANGES.START.MAX
        ) {
          const validWords = words.filter((word) =>
            hasLetterCombination(
              word.toUpperCase(),
              WORD_LEVEL_RANGES.START.LETTERS,
            ),
          );
          return validWords.length > 0
            ? getRandomWord(validWords)
            : getRandomWord(words);
        } else if (
          level >= WORD_LEVEL_RANGES.MID.MIN &&
          level <= WORD_LEVEL_RANGES.MID.MAX
        ) {
          const validWords = words.filter((word) =>
            hasAnyLetter(word.toUpperCase(), WORD_LEVEL_RANGES.MID.LETTERS),
          );
          return validWords.length > 0
            ? getRandomWord(validWords)
            : getRandomWord(words);
        } else {
          return getRandomWord(words);
        }
      };

      const wordsToUse =
        availableWords.length >= 5 ? availableWords : filteredWords;

      let word = getWordBasedOnLevel(wordsToUse);
      let wordCount = countLetters(word);
      let possibleWordsList = wordsToUse.filter((w) =>
        canFormWord(countLetters(w), wordCount),
      );

      const maxAttempts = 100;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (possibleWordsList.length >= 12 && possibleWordsList.length <= 22) {
          break;
        }
        word = getWordBasedOnLevel(wordsToUse);
        wordCount = countLetters(word);
        possibleWordsList = wordsToUse.filter((w) =>
          canFormWord(countLetters(w), wordCount),
        );
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
