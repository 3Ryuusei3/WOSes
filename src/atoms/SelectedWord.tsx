import ShuffledWordObjectType from '../types/ShuffledWordObject';
import Difficulty from '../types/Difficulty';
import { POINTS_PER_LETTER } from '../constant';

interface SelectedWordProps {
  shuffledWordObject: ShuffledWordObjectType[];
  percentage: number;
  gameDifficulty: Difficulty
  SHOW_LETTERS_PERCENTAGE: number;
}

export default function SelectedWord({
  shuffledWordObject,
  percentage,
  gameDifficulty,
  SHOW_LETTERS_PERCENTAGE,
}: SelectedWordProps) {
  const getLetterClasses = (letter: ShuffledWordObjectType) => {
    const classes = ['selectedLetter'];

    if (letter.isDark && gameDifficulty.dark) {
      if (percentage < SHOW_LETTERS_PERCENTAGE) {
        classes.push('dark-outline');
      } else {
        classes.push('dark');
      }
    }

    if (letter.isFake && percentage < SHOW_LETTERS_PERCENTAGE) {
      classes.push('fake');
    }

    if (letter.isHidden && gameDifficulty.hidden) {
      classes.push('hidden');
    }

    if (letter.isCommon && !letter.isDark) {
      classes.push('common');
    }

    return classes.join(' ');
  };

  return (
    <div
      key={shuffledWordObject.map(letter => letter.letter).join('')}
      className="selectedWord"
    >
      {shuffledWordObject.map((letter, index) => (
        <span
          key={`${index}-${letter.letter}`}
          className={getLetterClasses(letter)}
        >
          {letter.isHidden && gameDifficulty.hidden && percentage > SHOW_LETTERS_PERCENTAGE
            ? '?'
            : letter.letter
          }
          <span className='letterPoints'>
            {POINTS_PER_LETTER[letter.letter as keyof typeof POINTS_PER_LETTER]}
          </span>
        </span>
      ))}
    </div>
  );
}
