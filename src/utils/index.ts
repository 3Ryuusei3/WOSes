import { LEVELS_TO_ADVANCE, THRESHHOLD  } from "../constant";

const generateRandomRoom = () =>{
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return '/game?id=' + result;
}

const calculateLevelsToAdvance = (completionPercentage: number): number => {
  if (completionPercentage === THRESHHOLD.FIVE_STAR) return LEVELS_TO_ADVANCE.FIVE_STAR;
  if (completionPercentage >= THRESHHOLD.THREE_STAR) return LEVELS_TO_ADVANCE.THREE_STAR;
  if (completionPercentage >= THRESHHOLD.TWO_STAR) return LEVELS_TO_ADVANCE.TWO_STAR;
  if (completionPercentage >= THRESHHOLD.ONE_STAR) return LEVELS_TO_ADVANCE.ONE_STAR;
  return 0;
};

const calculateProbability = (
  level: number,
  range: {
    START: {
      LEVEL: number;
      PERCENTAGE: number;
    },
    END: {
      LEVEL: number;
      PERCENTAGE: number;
    }
  }
): number => {
  if (level < range.START.LEVEL) return range.START.PERCENTAGE;
  if (level > range.END.LEVEL) return range.END.PERCENTAGE;

  const levelProgress = (level - range.START.LEVEL) / (range.END.LEVEL - range.START.LEVEL);
  const percentageRange = range.END.PERCENTAGE - range.START.PERCENTAGE;
  return Math.floor(range.START.PERCENTAGE + (levelProgress * percentageRange));
};

export { generateRandomRoom, calculateLevelsToAdvance, calculateProbability };
