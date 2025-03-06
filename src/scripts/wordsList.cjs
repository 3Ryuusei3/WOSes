const fs = require('fs');
const words = require('an-array-of-spanish-words');
fs.writeFileSync('allWords.json', JSON.stringify(words, null, 2), 'utf-8');

console.log('All words have been written to allWords.json');
