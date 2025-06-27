import { useTranslation } from 'react-i18next';
import { getLanguageConstants } from '../constant';

import ShuffledWordObjectType from '../types/ShuffledWordObject';
import Mechanics from '../types/Mechanics';

interface SelectedWordProps {
  shuffledWordObject: ShuffledWordObjectType[];
  percentage: number;
  gameMechanics: Mechanics;
  SHOW_LETTERS_PERCENTAGE: number;
}

export default function SelectedWord({
  shuffledWordObject,
  percentage,
  gameMechanics,
  SHOW_LETTERS_PERCENTAGE,
}: SelectedWordProps) {
  const { i18n } = useTranslation();
  const { POINTS_PER_LETTER } = getLanguageConstants(i18n.language);

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

    if (letter.isCommon && (!letter.isDark || percentage < SHOW_LETTERS_PERCENTAGE)) {
      classes.push('common');
    }

    if (letter.isStill && gameMechanics.still) {
      classes.push('still');
    }

    return classes.join(' ');
  };

  const getDisplayLetter = (letter: ShuffledWordObjectType) => {
    if (letter.isHidden && gameMechanics.hidden && percentage > SHOW_LETTERS_PERCENTAGE) {
      return '?';
    }
    return letter.letter;
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
          {getDisplayLetter(letter)}
          <span className='letterPoints'>
            {POINTS_PER_LETTER[letter.letter as keyof typeof POINTS_PER_LETTER] || 1}
          </span>
        </span>
      ))}
    </div>
  );
}
