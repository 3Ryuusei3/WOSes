import useRandomWords from './hooks/useRandomWords';
import useShuffledWord from './hooks/useShuffledWord';
import useInputWords from './hooks/useInputWords';
import useProgressBar from './hooks/useProgressBar';
import useCalculatePoints from './hooks/useCalculatePoints';
import useZoom from './hooks/useZoom';
import './App.css';
import logo from './assets/logo.png';
import points from './points.json';

function App() {
  const { randomWord, possibleWords } = useRandomWords();
  const { percentage } = useProgressBar(60);
  const shuffledWord = useShuffledWord(randomWord, 8000, percentage > 0);
  const { inputWord, inputtedWords, correctWords, handleChange, handleKeyDown } = useInputWords(possibleWords);
  const { correctWordsPoints, goalPoints } = useCalculatePoints(possibleWords, correctWords);
  const zoom = useZoom();

  return (
    <main className='container' style={{ zoom }}>
      <div className='score__container'>
        <div className={`score__container--box ${correctWords.length === possibleWords.length ? 'highlight' : ''}`}>
          <p>PALABRAS</p>
          <h3>{correctWords.length} / {possibleWords.length}</h3>
        </div>
        <img src={logo} alt='logo' width={170} />
        <div className={`score__container--box ${correctWordsPoints() >= goalPoints ? 'highlight' : ''}`}>
          <p>OBJETIVO</p>
          <h3>{correctWordsPoints()} / {goalPoints}</h3>
        </div>
      </div>
      <div className='game__container'>
        <div className="selectedWord">
          {shuffledWord.split('').map((letter, index) => (
            <span key={`${index}-${letter}`} className='selectedLetter'>
              {letter}
              <span className='letterPoints'>{points[letter as keyof typeof points]}</span>
            </span>
          ))}
        </div>
        <div className="progress" style={{ '--remaining-percentage': `${percentage}%` } as React.CSSProperties}></div>
        <ul className='wordlist'>
          {possibleWords.map((word, index) => (
            <li
              key={`${index}-${word}`}
              className={`word ${inputtedWords.includes(word) ? 'active' : ''}`}
            >
              {inputtedWords.includes(word) && (
                <span className='playerName'>MANU</span>
              )}
              <span className='wordLetters'>
                {word.split('').map((letter, letterIndex) => (
                  <span key={`${index}-${word}-${letter}-${letterIndex}`} className='letter'>
                    {letter}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <input
          type="text"
          value={inputWord}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    </main>
  );
}

export default App;
