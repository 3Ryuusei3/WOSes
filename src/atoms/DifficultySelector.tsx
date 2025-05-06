// New component: DifficultySelector.tsx
import Difficulty from '../types/Difficulty';
import Tooltip from './Tooltip';

interface DifficultySelectorProps {
  gameDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export default function DifficultySelector({ gameDifficulty, onDifficultyChange }: DifficultySelectorProps) {
  const handleDifficulty = (difficulty: Difficulty) => {
    onDifficultyChange(difficulty);
  };

  return (
    <div className="h-section gap-xs f-jc-c pos-rel w-fit mx-auto">
      <button
        className={`btn ${gameDifficulty === 'easy' ? 'selected' : ''} btn--sm btn--win`}
        onClick={() => handleDifficulty('easy')}
      >
        FÁCIL
      </button>
      <button
        className={`btn ${gameDifficulty === 'medium' ? 'selected' : ''} btn--sm`}
        onClick={() => handleDifficulty('medium')}
      >
        ESTÁNDAR
      </button>
      <button
        className={`btn ${gameDifficulty === 'hard' ? 'selected' : ''} btn--sm btn--lose`}
        onClick={() => handleDifficulty('hard')}
      >
        DIFÍCIL
      </button>
      <Tooltip message="Palabras organizadas por niveles según la frecuencia de uso percibida por los usuarios. La dificultad ''DIFÍCIL'' contiene todas las palabras que existen en la RAE.">
        <div className='info-icon'>𝑖</div>
      </Tooltip>
    </div>
  );
}
