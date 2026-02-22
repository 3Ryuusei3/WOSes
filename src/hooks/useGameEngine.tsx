import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GameEngine from '../domain/game/GameEngine';

/**
 * Hook para usar el GameEngine con el idioma actual
 */
export const useGameEngine = () => {
  const { i18n } = useTranslation();
  
  const gameEngine = useMemo(() => {
    return new GameEngine(i18n.language);
  }, [i18n.language]);
  
  return gameEngine;
};

export default useGameEngine;
