import GameLogo from './GameLogo';
import Word from '../types/Word';

interface ScoreContainerProps {
  words: Word[];
  correctWordsPoints: () => number;
  goalPoints: number;
  level: number;
}

export default function ScoreContainer({ words, correctWordsPoints, goalPoints, level }: ScoreContainerProps) {
  const guessedCount = words.filter(w => w.guessed).length;

  return (
    <div className='score__container'>
      <div className={`score__container--box ${guessedCount === words.length ? 'won' : ''}`}>
        <div className="v-section">
          <p>PALABRAS</p>
          <h3>{guessedCount}/{words.length}</h3>
        </div>
      </div>
      <GameLogo />
      <div className={`score__container--box ${correctWordsPoints() >= goalPoints ? 'won' : ''}`}>
        <div className="h-section gap-md">
          <div className="v-section">
            <p>OBJETIVO</p>
            <h3>{correctWordsPoints()}/{goalPoints}</h3>
          </div>
          <div className="v-section">
            <p>NIVEL</p>
            <h3>{level}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
