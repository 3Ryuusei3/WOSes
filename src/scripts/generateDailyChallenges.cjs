const fs = require("fs");
const easyWords = require("../data/easy.json");
const mediumWords = require("../data/medium.json");
const hardWords = require("../data/hard.json");

const canFormWord = (word, letters) => {
  const lettersCount = letters.split("").reduce((acc, letter) => {
    acc[letter] = (acc[letter] || 0) + 1;
    return acc;
  }, {});

  for (const letter of word) {
    if (!lettersCount[letter]) return false;
    lettersCount[letter]--;
  }
  return true;
};

const countPossibleWords = (word, wordList) => {
  return wordList.filter((w) => canFormWord(w, word)).length;
};

const generateMechanics = () => {
  const mechanics = {
    has_hidden_letter: Math.random() < 0.4,
    has_fake_letter: Math.random() < 0.4,
    has_dark_mode: Math.random() < 0.3,
    has_still_mode: Math.random() < 0.3,
    has_first_letter: Math.random() < 0.3,
  };

  const activeCount = Object.values(mechanics).filter(Boolean).length;
  if (activeCount > 2) {
    const keys = Object.keys(mechanics).filter((k) => mechanics[k]);
    while (Object.values(mechanics).filter(Boolean).length > 2) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      mechanics[randomKey] = false;
    }
  }

  return mechanics;
};

const generateChallenges = (count = 10, startId = 1) => {
  const challenges = [];
  const allWords = {
    easy: easyWords.words.filter((w) => w.length >= 4 && w.length <= 9),
    medium: mediumWords.words.filter((w) => w.length >= 4 && w.length <= 9),
    hard: hardWords.words.filter((w) => w.length >= 4 && w.length <= 9),
  };

  const difficulties = ["easy", "medium", "hard"];
  let attempts = 0;
  const maxAttempts = 10000;

  while (challenges.length < count && attempts < maxAttempts) {
    attempts++;

    const difficulty =
      difficulties[Math.floor(Math.random() * difficulties.length)];
    const wordList = allWords[difficulty];

    const word = wordList[Math.floor(Math.random() * wordList.length)];

    if (challenges.find((c) => c.word === word)) continue;

    const possibleCount = countPossibleWords(word, wordList);

    if (possibleCount >= 15 && possibleCount <= 30) {
      const timeSeconds = 60 + Math.floor(Math.random() * 31);
      const mechanics = generateMechanics();

      const challengeNumber = startId + challenges.length;
      challenges.push({
        challenge_number: challengeNumber,
        word,
        difficulty,
        time_seconds: timeSeconds,
        ...mechanics,
      });

      console.log(
        `Reto ${challengeNumber}: ${word} (${difficulty}) - ${possibleCount} palabras - ${timeSeconds}s`,
      );
    }
  }

  return challenges;
};

// Generar SQL
const generateSQL = (challenges) => {
  let sql = "-- Retos Diarios Generados\n\n";

  challenges.forEach((c) => {
    sql += `INSERT INTO public.daily_challenges (
  challenge_number, word, difficulty, time_seconds,
  has_hidden_letter, has_fake_letter, has_dark_mode, has_still_mode, has_first_letter
) VALUES (
  ${c.challenge_number}, '${c.word}', '${c.difficulty}', ${c.time_seconds},
  ${c.has_hidden_letter}, ${c.has_fake_letter}, ${c.has_dark_mode}, ${c.has_still_mode}, ${c.has_first_letter}
);\n\n`;
  });

  return sql;
};

const args = process.argv.slice(2);
let startId = 1101;
let count = 1000;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--startId" && args[i + 1]) {
    startId = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === "--count" && args[i + 1]) {
    count = parseInt(args[i + 1], 10);
    i++;
  }
}

console.log(`\nGenerando ${count} retos empezando desde ID ${startId}...\n`);

const challenges = generateChallenges(count, startId);
const sql = generateSQL(challenges);

fs.writeFileSync("dailyChallenges.sql", sql);
console.log(
  "\n✅ Archivo dailyChallenges.sql generado con",
  challenges.length,
  "retos",
);
