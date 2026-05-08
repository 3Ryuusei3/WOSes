import Mechanics from "../types/Mechanics";

export interface AlexLevel {
  word: string;
  timeSeconds: number;
  mechanics: Mechanics;
}

export const ALEX_TOTAL_LEVELS = 7;
export const ALEX_LEVEL_TIME = 120;

const ALEX_WORDS = [
  "AMARE",
  "ORGULLO",
  "NOVIOS",
  "FUTUROS",
  "LETRA",
  "JUNTOS",
  "FELICES",
];

const MECHANICS_POOL: (keyof Mechanics)[] = [
  "still",
  "dark",
  "fake",
  "hidden",
  "first",
];

const emptyMechanics = (): Mechanics => ({
  dark: false,
  fake: false,
  hidden: false,
  first: false,
  still: false,
  mirrored: false,
});

const pickRandomMechanics = (count: number): Mechanics => {
  const mech = emptyMechanics();
  const pool = [...MECHANICS_POOL];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const key = pool.splice(idx, 1)[0];
    mech[key] = true;
  }
  return mech;
};

export const generateAlexLevels = (): AlexLevel[] => {
  return ALEX_WORDS.map((word, index) => {
    const mechCount = index === 0 ? 0 : Math.random() < 0.5 ? 1 : 2;
    return {
      word,
      timeSeconds: ALEX_LEVEL_TIME,
      mechanics: pickRandomMechanics(mechCount),
    };
  });
};

export const ALEX_FINAL_TITLE = "¡ENHORABUENA ALEX!";
export const ALEX_FINAL_SUBTITLE =
  "GRACIAS POR JUGAR TODO ESTE TIEMPO CONMIGO A LAS LETRAS Y HACERLO TAN ESPECIAL JUNTOS. TE QUIERO MUCHÍSIMO, ERES INCREÍBLE.";
