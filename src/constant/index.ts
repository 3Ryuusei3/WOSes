const START_TIME = 90;

const THRESHHOLD = {
  ONE_STAR: 40,
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
const COUNTDOWN = 3.1;

const RUNNING_OUT_OF_TIME_PERCENTAGE = 15;

const SHOW_LETTERS_PERCENTAGE = 35;

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

const FAKE_LETTER_LEVEL_START = 7;

const HIDDEN_LETTER_LEVEL_START = 16;

const HIDDEN_WORDS_LEVEL_START = 25;

const SHUFFLE_INTERVAL = 10000;

export {
  START_TIME,
  THRESHHOLD,
  COUNTDOWN,
  LEVELS_TO_ADVANCE,
  RUNNING_OUT_OF_TIME_PERCENTAGE,
  SHOW_LETTERS_PERCENTAGE,
  LETTERS,
  POINTS_PER_LETTER,
  FAKE_LETTER_LEVEL_START,
  HIDDEN_LETTER_LEVEL_START,
  SHUFFLE_INTERVAL,
  HIDDEN_WORDS_LEVEL_START
};
