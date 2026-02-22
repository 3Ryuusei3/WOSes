import { THRESHHOLD, LEVELS_TO_ADVANCE } from '../../constant';

export class LevelManager {
  /**
   * Calcula cuántos niveles avanzar basándose en el porcentaje de completitud
   */
  calculateLevelsToAdvance(completionPercentage: number): number {
    if (completionPercentage === THRESHHOLD.FIVE_STAR) {
      return LEVELS_TO_ADVANCE.FIVE_STAR;
    }
    if (completionPercentage >= THRESHHOLD.THREE_STAR) {
      return LEVELS_TO_ADVANCE.THREE_STAR;
    }
    if (completionPercentage >= THRESHHOLD.TWO_STAR) {
      return LEVELS_TO_ADVANCE.TWO_STAR;
    }
    if (completionPercentage >= THRESHHOLD.ONE_STAR) {
      return LEVELS_TO_ADVANCE.ONE_STAR;
    }
    return 0;
  }

  /**
   * Determina si el jugador ha completado el nivel
   */
  hasCompletedLevel(
    currentPoints: number,
    goalPoints: number,
    levelPoints: number,
    totalWords: number,
    foundWords: number
  ): boolean {
    const hasReachedGoal = currentPoints >= goalPoints;
    const isPerfect = levelPoints > 0 && 
                      levelPoints === currentPoints && 
                      foundWords === totalWords;
    
    return hasReachedGoal || isPerfect;
  }

  /**
   * Calcula el tiempo a remover basándose en el rendimiento
   */
  calculateTimeToRemove(
    levelsToAdvance: number,
    currentTime: number,
    minTime: number = 15
  ): number {
    if (levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR) {
      return 0; // No se reduce tiempo en ronda perfecta
    }
    
    if (levelsToAdvance === LEVELS_TO_ADVANCE.THREE_STAR) {
      return Math.max(0, Math.floor((currentTime - minTime) * 0.1));
    }
    
    if (levelsToAdvance === LEVELS_TO_ADVANCE.TWO_STAR) {
      return Math.max(0, Math.floor((currentTime - minTime) * 0.15));
    }
    
    if (levelsToAdvance === LEVELS_TO_ADVANCE.ONE_STAR) {
      return Math.max(0, Math.floor((currentTime - minTime) * 0.2));
    }
    
    return 0;
  }

  /**
   * Calcula el nuevo tiempo después de aplicar la reducción
   */
  calculateNewGameTime(
    currentTime: number,
    levelsToAdvance: number,
    minTime: number = 15
  ): number {
    const timeToRemove = this.calculateTimeToRemove(levelsToAdvance, currentTime, minTime);
    return Math.max(minTime, currentTime - timeToRemove);
  }

  /**
   * Determina si es una ronda perfecta
   */
  isPerfectRound(levelsToAdvance: number): boolean {
    return levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR;
  }

  /**
   * Calcula el nuevo nivel después de avanzar
   */
  calculateNewLevel(currentLevel: number, levelsToAdvance: number): number {
    return currentLevel + levelsToAdvance;
  }

  /**
   * Obtiene información sobre el avance de nivel
   */
  getLevelAdvanceInfo(completionPercentage: number, currentLevel: number) {
    const levelsToAdvance = this.calculateLevelsToAdvance(completionPercentage);
    const newLevel = this.calculateNewLevel(currentLevel, levelsToAdvance);
    const isPerfect = this.isPerfectRound(levelsToAdvance);

    return {
      levelsToAdvance,
      newLevel,
      isPerfect,
      rating: this.getLevelRating(levelsToAdvance),
    };
  }

  /**
   * Obtiene la calificación del nivel (estrellas)
   */
  private getLevelRating(levelsToAdvance: number): 'five_star' | 'three_star' | 'two_star' | 'one_star' | 'none' {
    if (levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR) return 'five_star';
    if (levelsToAdvance === LEVELS_TO_ADVANCE.THREE_STAR) return 'three_star';
    if (levelsToAdvance === LEVELS_TO_ADVANCE.TWO_STAR) return 'two_star';
    if (levelsToAdvance === LEVELS_TO_ADVANCE.ONE_STAR) return 'one_star';
    return 'none';
  }
}

export default LevelManager;
