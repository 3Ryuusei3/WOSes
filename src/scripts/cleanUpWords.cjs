const fs = require('fs');

// Cargar los archivos JSON usando require
const originalWordsData = require('../data/filteredData/pollThreeUnfiltered.json');
const filteredWordsData = require('../data/filteredData/easySara.json');

// Filtrar las palabras
function eliminarPalabras() {
  const originalWords = originalWordsData.words;  // Array con las 260k palabras
  const filteredWords = new Set(filteredWordsData.words);  // Conjunto con las 15k palabras

  // Filtrar las palabras originales, eliminando las que están en las palabras filtradas
  const palabrasFiltradas = originalWords.filter(word => !filteredWords.has(word));

  // Guardar las palabras filtradas en un nuevo archivo
  const result = { words: palabrasFiltradas };
  fs.writeFileSync('./../data/filteredData/pollThree.json', JSON.stringify(result, null, 2), 'utf8');

  console.log(`✅ Se han eliminado ${originalWords.length - palabrasFiltradas.length} palabras.`);
}

eliminarPalabras();
