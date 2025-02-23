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

export { generateRandomRoom, calculateLevelsToAdvance };
