import ShuffledWordObjectType from '../types/ShuffledWordObject';
import Mechanics from '../types/Mechanics';
import { POINTS_PER_LETTER } from '../constant';

interface SelectedWordProps {
  shuffledWordObject: ShuffledWordObjectType[];
  percentage: number;
  gameMechanics: Mechanics
  SHOW_LETTERS_PERCENTAGE: number;
}

export default function SelectedWord({
  shuffledWordObject,
  percentage,
  gameMechanics,
  SHOW_LETTERS_PERCENTAGE,
}: SelectedWordProps) {
  const getLetterClasses = (letter: ShuffledWordObjectType) => {
    const classes = ['selectedLetter'];

    if (letter.isDark && gameMechanics.dark) {
      if (percentage < SHOW_LETTERS_PERCENTAGE) {
        classes.push('dark-outline');
      } else {
        classes.push('dark');
      }
    }

    if (letter.isFake && percentage < SHOW_LETTERS_PERCENTAGE) {
      classes.push('fake');
    }

    if (letter.isHidden && gameMechanics.hidden) {
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
          {letter.isHidden && gameMechanics.hidden && percentage > SHOW_LETTERS_PERCENTAGE
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
