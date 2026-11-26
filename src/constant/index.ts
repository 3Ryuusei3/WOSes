const START_TIME = 90;

const THRESHHOLD = {
  ONE_STAR: 45,
  TWO_STAR: 70,
  THREE_STAR: 90,
  FIVE_STAR: 100,
};
const LEVELS_TO_ADVANCE = {
  ONE_STAR: 1,
  TWO_STAR: 2,
  THREE_STAR: 3,
  FIVE_STAR: 5,
};
const COUNTDOWN = 3.01;

const RUNNING_OUT_OF_TIME_PERCENTAGE = 15;

const SHOW_LETTERS_RANGE = {
  START: {
    LEVEL: 6,
    PERCENTAGE: 60,
  },
  END: {
    LEVEL: 60,
    PERCENTAGE: 40,
  },
};

const LETTERS_ES = "abcdefghijklmnñopqrstuvwxyz";

const POINTS_PER_LETTER_ES = {
  a: 1,
  e: 1,
  i: 1,
  l: 1,
  n: 1,
  o: 1,
  r: 1,
  s: 1,
  t: 1,
  u: 1,
  d: 2,
  g: 2,
  b: 3,
  c: 3,
  m: 3,
  p: 3,
  f: 4,
  h: 4,
  v: 4,
  y: 4,
  q: 5,
  j: 8,
  ñ: 8,
  x: 8,
  z: 10,
  k: 10,
  w: 10,
};

// First levels are a warm-up in every difficulty:
// - WARMUP: board word of 5–6 letters, no rare letters, and most of the
//   words to find from the Estándar list
// - EARLY: board word of up to 7 letters, at most one rare letter
// After EARLY.MAX, any word (START / MID letters still apply by level).
const EARLY_LEVELS = {
  WARMUP: { MAX: 5, MIN_LEN: 5, MAX_LEN: 6, MIN_EASY_SHARE: 0.7 },
  EARLY: { MAX: 15, MAX_LEN: 7, MAX_RARE: 1 },
};

const RARE_LETTERS_ES = ["ñ", "x", "z", "j", "q", "k", "w"];
const RARE_LETTERS_EN = ["q", "x", "z", "j", "k"];

const WORD_LEVEL_RANGES_ES = {
  START: {
    MIN: 1,
    MAX: 10,
    LETTERS: ["AS", "ES", "RA", "EN", "LA", "TA", "DE"],
  },
  MID: {
    MIN: 11,
    MAX: 30,
    LETTERS: ["A", "S", "R", "D"],
  },
};

const LETTERS_EN = "abcdefghijklmnopqrstuvwxyz";

const POINTS_PER_LETTER_EN = {
  a: 1,
  e: 1,
  i: 1,
  o: 1,
  n: 1,
  r: 1,
  t: 1,
  l: 1,
  s: 1,
  u: 1,
  d: 2,
  g: 2,
  b: 3,
  c: 3,
  m: 3,
  p: 3,
  f: 4,
  h: 4,
  v: 4,
  w: 4,
  y: 4,
  k: 5,
  j: 8,
  x: 8,
  q: 10,
  z: 10,
};

const WORD_LEVEL_RANGES_EN = {
  START: {
    MIN: 1,
    MAX: 10,
    LETTERS: ["AN", "IN", "ER", "ON", "AT", "ED", "ND"],
  },
  MID: {
    MIN: 11,
    MAX: 30,
    LETTERS: ["E", "T", "A", "O"],
  },
};

const LEVEL_RANGES = {
  STILL_LETTER: {
    START: 6,
    END: 22,
  },
  DARK_LETTER: {
    START: 10,
    END: 26,
  },
  FAKE_LETTER: {
    START: 14,
    END: 30,
  },
  HIDDEN_LETTER: {
    START: 18,
    END: 34,
  },
  MIRRORED_LETTER: {
    START: 30,
    END: 62,
  },
  FIRST_LETTER: {
    START: 42,
    END: 70,
  },
};

const SHUFFLE_INTERVAL = 10000;

export const getLanguageConstants = (language: string) => {
  if (language === "en") {
    return {
      LETTERS: LETTERS_EN,
      POINTS_PER_LETTER: POINTS_PER_LETTER_EN,
      WORD_LEVEL_RANGES: WORD_LEVEL_RANGES_EN,
      RARE_LETTERS: RARE_LETTERS_EN,
    };
  }
  return {
    LETTERS: LETTERS_ES,
    POINTS_PER_LETTER: POINTS_PER_LETTER_ES,
    WORD_LEVEL_RANGES: WORD_LEVEL_RANGES_ES,
    RARE_LETTERS: RARE_LETTERS_ES,
  };
};

export {
  EARLY_LEVELS,
  START_TIME,
  THRESHHOLD,
  COUNTDOWN,
  LEVELS_TO_ADVANCE,
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHOW_LETTERS_RANGE,
  LETTERS_ES as LETTERS,
  LEVEL_RANGES,
  POINTS_PER_LETTER_ES as POINTS_PER_LETTER,
  SHUFFLE_INTERVAL,
  WORD_LEVEL_RANGES_ES as WORD_LEVEL_RANGES,
};
