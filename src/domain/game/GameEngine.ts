import ScoreCalculator from './ScoreCalculator';
import LevelManager from './LevelManager';
import Word from '../../types/Word';

export interface GameState {
  level: number;
  totalPoints: number;
  gameTime: number;
  numberOfRounds: number;
  numberOfPerfectRounds: number;
}

export interface RoundResult {
  passed: boolean;
  levelsToAdvance: number;
  pointsEarned: number;
  newLevel: number;
  newGameTime: number;
  isPerfect: boolean;
  completionPercentage: number;
}

export class GameEngine {
  private scoreCalculator: ScoreCalculator;
  private levelManager: LevelManager;

  constructor(language: string = 'es') {
    this.scoreCalculator = new ScoreCalculator(language);
    this.levelManager = new LevelManager();
  }

  /**
   * Evalúa el resultado de una ronda
   */
  evaluateRound(
    possibleWords: string[],
    correctWords: string[],
    currentState: GameState
  ): RoundResult {
    const stats = this.scoreCalculator.calculateLevelStats(possibleWords, correctWords);
    
    const passed = this.levelManager.hasCompletedLevel(
      stats.currentPoints,
      stats.goalPoints,
      stats.levelPoints,
      stats.totalWords,
      stats.wordsFound
    );

    if (!passed) {
      return {
        passed: false,
        levelsToAdvance: 0,
        pointsEarned: stats.currentPoints,
        newLevel: currentState.level,
        newGameTime: currentState.gameTime,
        isPerfect: false,
        completionPercentage: stats.completionPercentage,
      };
    }

    const levelsToAdvance = this.levelManager.calculateLevelsToAdvance(stats.completionPercentage);
    const newLevel = this.levelManager.calculateNewLevel(currentState.level, levelsToAdvance);
    const newGameTime = this.levelManager.calculateNewGameTime(currentState.gameTime, levelsToAdvance);
    const isPerfect = this.levelManager.isPerfectRound(levelsToAdvance);

    return {
      passed: true,
      levelsToAdvance,
      pointsEarned: stats.currentPoints,
      newLevel,
      newGameTime,
      isPerfect,
      completionPercentage: stats.completionPercentage,
    };
  }

  /**
   * Actualiza el estado del juego después de una ronda
   */
  updateGameState(currentState: GameState, roundResult: RoundResult): GameState {
    return {
      level: roundResult.newLevel,
      totalPoints: currentState.totalPoints + roundResult.pointsEarned,
      gameTime: roundResult.newGameTime,
      numberOfRounds: currentState.numberOfRounds + 1,
      numberOfPerfectRounds: currentState.numberOfPerfectRounds + (roundResult.isPerfect ? 1 : 0),
    };
  }

  /**
   * Calcula estadísticas del nivel actual
   */
  getCurrentLevelStats(possibleWords: string[], correctWords: string[]) {
    return this.scoreCalculator.calculateLevelStats(possibleWords, correctWords);
  }

  /**
   * Verifica si el nivel está completo
   */
  isLevelComplete(
    possibleWords: string[],
    correctWords: string[]
  ): boolean {
    const stats = this.scoreCalculator.calculateLevelStats(possibleWords, correctWords);
    
    return this.levelManager.hasCompletedLevel(
      stats.currentPoints,
      stats.goalPoints,
      stats.levelPoints,
      stats.totalWords,
      stats.wordsFound
    );
  }

  /**
   * Calcula puntos de una palabra específica
   */
  calculateWordPoints(word: string): number {
    return this.scoreCalculator.calculateWordPoints(word);
  }

  /**
   * Obtiene información sobre el avance de nivel
   */
  getLevelAdvanceInfo(completionPercentage: number, currentLevel: number) {
    return this.levelManager.getLevelAdvanceInfo(completionPercentage, currentLevel);
  }

  /**
   * Calcula el tiempo que se removerá en la próxima ronda
   */
  getTimeToRemove(levelsToAdvance: number, currentTime: number): number {
    return this.levelManager.calculateTimeToRemove(levelsToAdvance, currentTime);
  }

  /**
   * Resetea el estado del juego
   */
  createInitialState(startTime: number): GameState {
    return {
      level: 1,
      totalPoints: 0,
      gameTime: startTime,
      numberOfRounds: 0,
      numberOfPerfectRounds: 0,
    };
  }

  /**
   * Calcula puntos desde un array de Words
   */
  calculatePointsFromWords(words: Word[]): number {
    return this.scoreCalculator.calculatePointsFromWords(words);
  }
}

export default GameEngine;
