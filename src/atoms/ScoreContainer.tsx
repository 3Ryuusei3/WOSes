import GameLogo from './GameLogo';

interface ScoreContainerProps {
  correctWords: string[];
  possibleWords: string[];
  correctWordsPoints: () => number;
  goalPoints: number;
  level: number;
}

export default function ScoreContainer({ correctWords, possibleWords, correctWordsPoints, goalPoints, level }: ScoreContainerProps) {
  return (
    <div className='score__container'>
      <div className={`score__container--box ${correctWords.length === possibleWords.length ? 'won' : ''}`}>
        <div className="h-section">
          <p>PALABRAS</p>
          <h3>{correctWords.length}/{possibleWords.length}</h3>
        </div>
      </div>
      <GameLogo />
      <div className={`score__container--box ${correctWordsPoints() >= goalPoints ? 'won' : ''}`}>
        <div className="v-section gap-md">
          <div className="h-section">
            <p>OBJETIVO</p>
            <h3>{correctWordsPoints()}/{goalPoints}</h3>
          </div>
          <div className="h-section">
            <p>NIVEL</p>
            <h3>{level}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
