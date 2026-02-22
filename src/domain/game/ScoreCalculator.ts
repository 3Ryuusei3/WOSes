import { getLanguageConstants } from '../../constant';
import Word from '../../types/Word';

export class ScoreCalculator {
  private language: string;

  constructor(language: string = 'es') {
    this.language = language;
  }

  /**
   * Calcula los puntos de una palabra basándose en sus letras
   */
  calculateWordPoints(word: string): number {
    const { POINTS_PER_LETTER } = getLanguageConstants(this.language);
    
    return word.split('').reduce((total, letter) => {
      const points = POINTS_PER_LETTER[letter as keyof typeof POINTS_PER_LETTER] || 0;
      return total + points;
    }, 0);
  }

  /**
   * Calcula el total de puntos de palabras correctas
   */
  calculateCorrectWordsPoints(correctWords: string[]): number {
    return correctWords.reduce((total, word) => {
      return total + this.calculateWordPoints(word);
    }, 0);
  }

  /**
   * Calcula el total de puntos de todas las palabras posibles
   */
  calculateLevelPoints(possibleWords: string[]): number {
    return possibleWords.reduce((total, word) => {
      return total + this.calculateWordPoints(word);
    }, 0);
  }

  /**
   * Calcula los puntos objetivo (meta) para pasar el nivel
   */
  calculateGoalPoints(levelPoints: number): number {
    return Math.ceil(levelPoints * 0.45);
  }

  /**
   * Calcula el porcentaje de completitud del nivel
   */
  calculateCompletionPercentage(currentPoints: number, levelPoints: number): number {
    if (levelPoints === 0) return 0;
    return Math.round((currentPoints / levelPoints) * 100);
  }

  /**
   * Calcula los puntos de las palabras acertadas desde un array de Word
   */
  calculatePointsFromWords(words: Word[]): number {
    const correctWords = words
      .filter(w => w.guessed)
      .map(w => w.word);
    
    return this.calculateCorrectWordsPoints(correctWords);
  }

  /**
   * Calcula estadísticas completas del nivel
   */
  calculateLevelStats(possibleWords: string[], correctWords: string[]) {
    const levelPoints = this.calculateLevelPoints(possibleWords);
    const currentPoints = this.calculateCorrectWordsPoints(correctWords);
    const goalPoints = this.calculateGoalPoints(levelPoints);
    const completionPercentage = this.calculateCompletionPercentage(currentPoints, levelPoints);

    return {
      levelPoints,
      currentPoints,
      goalPoints,
      completionPercentage,
      wordsFound: correctWords.length,
      totalWords: possibleWords.length,
      hasReachedGoal: currentPoints >= goalPoints,
      isPerfect: correctWords.length === possibleWords.length && levelPoints > 0,
    };
  }
}

export default ScoreCalculator;
