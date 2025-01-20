const fs = require('fs');
const wordsData = require('./../data/words1.json');

const canFormWord = (word, letters) => {
  const lettersCount = letters.split('').reduce((acc, letter) => {
    acc[letter] = (acc[letter] || 0) + 1;
    return acc;
  }, {});

  for (const letter of word) {
    if (!lettersCount[letter]) {
      return false;
    }
    lettersCount[letter]--;
  }
  return true;
};

const words = wordsData.words;
const filteredWords = words.filter(word => word.length >= 4 && word.length <= 9);
const finalArray = [];
let wordsChecked = 0;

filteredWords.forEach(word => {
  wordsChecked++;
  console.log(`Verificando palabra ${wordsChecked}: ${word}`);
  const possibleWords = filteredWords.filter(w => canFormWord(w, word));
  if (possibleWords.length >= 12 && possibleWords.length <= 27) {
    finalArray.push(...new Set([word, ...possibleWords]));
    console.log(`Al array final se le agregaron las palabras ${word} y ${possibleWords.join(', ')}`);
  }
});

const uniqueFinalArray = Array.from(new Set(finalArray));

fs.writeFile('filteredWords.json', JSON.stringify(uniqueFinalArray, null, 2), (err) => {
  if (err) throw err;
  console.log('El archivo filteredWords.json ha sido guardado.');
});
