const START_TIME = 90;

const THRESHHOLD = {
  ONE_STAR: 45,
  TWO_STAR: 70,
  THREE_STAR: 90,
  FIVE_STAR: 100,
}
const LEVELS_TO_ADVANCE = {
  ONE_STAR: 1,
  TWO_STAR: 2,
  THREE_STAR: 3,
  FIVE_STAR: 5,
}
const COUNTDOWN = 3.01;

const RUNNING_OUT_OF_TIME_PERCENTAGE = 15;

const SHOW_LETTERS_RANGE = {
  START: {
    LEVEL: 6,
    PERCENTAGE: 55
  },
  END: {
    LEVEL: 50,
    PERCENTAGE: 35
  }
};

const LETTERS = 'abcdefghijklmnñopqrstuvwxyz';

const POINTS_PER_LETTER = {
  "a": 1,
  "e": 1,
  "i": 1,
  "l": 1,
  "n": 1,
  "o": 1,
  "r": 1,
  "s": 1,
  "t": 1,
  "u": 1,
  "d": 2,
  "g": 2,
  "b": 3,
  "c": 3,
  "m": 3,
  "p": 3,
  "f": 4,
  "h": 4,
  "v": 4,
  "y": 4,
  "q": 5,
  "j": 8,
  "ñ": 8,
  "x": 8,
  "z": 10,
  "k": 10,
  "w": 10,
}

const LEVEL_RANGES = {
  STILL_LETTER: {
    START: 6,
    END: 22,
  },
  DARK_LETTER: {
    START: 10,
    END: 26
  },
  FAKE_LETTER: {
    START: 14,
    END: 30
  },
  HIDDEN_LETTER: {
    START: 18,
    END: 34
  },
  FIRST_LETTER: {
    START: 30,
    END: 60
  },
};

const SHUFFLE_INTERVAL = 10000;

const WORD_LEVEL_RANGES = {
  START: {
    MIN: 1,
    MAX: 10,
    LETTERS: ["AS", "ES", "RA", "EN", "LA", "TA", "DE"]
  },
  MID: {
    MIN: 11,
    MAX: 30,
    LETTERS: ["A", "S", "R", "D"]
  }
};

export {
  START_TIME,
  THRESHHOLD,
  COUNTDOWN,
  LEVELS_TO_ADVANCE,
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHOW_LETTERS_RANGE,
  LETTERS,
  LEVEL_RANGES,
  POINTS_PER_LETTER,
  SHUFFLE_INTERVAL,
  WORD_LEVEL_RANGES,
};
