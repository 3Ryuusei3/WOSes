import Word from '../types/Word';
import Player from '../types/Player';
import { useGameInput } from '../hooks/useGameInput';

interface GameInputProps {
  possibleWords: Word[];
  percentage: number;
  player: Player;
  level: number;
  randomWord: string;
}

export default function GameInput({
  possibleWords,
  percentage,
  player,
  level,
  randomWord,
}: GameInputProps) {
  const {
    inputWord,
    inputtedWords,
    animateError,
    animateSuccess,
    animateRepeated,
    gameInputRef,
    handleChange,
    handleKeyDown,
  } = useGameInput({ possibleWords, player, level, randomWord });

  return (
    <div className='game-input__container'>
      <div className='wordlist' ref={gameInputRef}>
        {inputtedWords.map((word, index) => (
          <li key={`${word.word}-${index}`} className={`word ${possibleWords.some(gw => gw.word === word.word && gw.guessed_by === player.name) ? 'guessed' : 'unguessed'}`}>
            <span className='wordLetters'>
              {word.word.split('').map((letter, letterIndex) => (
                <span key={`${index}-${word.word}-${letter}-${letterIndex}`} className='letter'>
                  <span>{letter}</span>
                </span>
              ))}
            </span>
          </li>
        ))}
      </div>
      <div className='h-section w100'>
        <input
          type="text"
          className={`mx-auto mt-auto ${animateError ? 'animate-error' : ''} ${animateSuccess ? 'animate-success' : ''} ${animateRepeated ? 'animate-repeated' : ''}`}
          placeholder='INTRODUCE LA PALABRA...'
          value={inputWord}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={percentage === 0}
        />
      </div>
    </div>
  );
}
