// New component: DifficultySelector.tsx
import Difficulty from '../types/Difficulty';

interface DifficultySelectorProps {
  gameDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export default function DifficultySelector({ gameDifficulty, onDifficultyChange }: DifficultySelectorProps) {
  const handleDifficulty = (difficulty: Difficulty) => {
    onDifficultyChange(difficulty);
  };

  const translateDifficulty = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'FÁCIL';
      case 'medium':
        return 'MEDIO';
      case 'hard':
        return 'DIFÍCIL';
    }
  };

  return (
    <>
      <div className="h-section gap-xs f-jc-c">
        <button className='btn btn--win' onClick={() => handleDifficulty('easy')}>FÁCIL</button>
        <button className='btn' onClick={() => handleDifficulty('medium')}>MEDIO</button>
        <button className='btn btn--lose' onClick={() => handleDifficulty('hard')}>DIFÍCIL</button>
      </div>
      <div className="h-section gap-xs f-jc-c">
        <button onClick={() => {}}>EMPEZAR PARTIDA {translateDifficulty(gameDifficulty)}</button>
      </div>
    </>
  );
}
