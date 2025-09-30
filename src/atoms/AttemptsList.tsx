import Attempt from '../types/Attempt';

interface AttemptsListProps {
  playerAttempts: Attempt[];
}

export default function AttemptsList({ playerAttempts }: AttemptsListProps) {

  return (
    <div className='attemptList'>
      {playerAttempts.map((it, idx) => (
        <h4 key={`${idx}-${it.word}`} className={`${it.status === 'correct' ? 'highlight' : it.status === 'tip' ? 'tip' : 'dark'} txt-center`}>
          {it.word.toUpperCase()}
        </h4>
      ))}
    </div>
  );
}
