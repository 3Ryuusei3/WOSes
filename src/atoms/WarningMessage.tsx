import { useTranslation } from 'react-i18next';
import Mechanics from "../types/Mechanics";

interface WarningMessageProps {
  gameMechanics: Mechanics;
}

export default function WarningMessage({ gameMechanics }: WarningMessageProps) {
  const { t } = useTranslation();

  const getLetterConditions = () => {
    const letters = [];
    if (gameMechanics.fake) letters.push(t('warningMessage.fake'));
    if (gameMechanics.hidden) letters.push(t('warningMessage.hidden'));
    if (gameMechanics.still) letters.push(t('warningMessage.still'));
    if (gameMechanics.dark) letters.push(t('warningMessage.dark'));

    if (letters.length === 0) return null;
    if (letters.length === 1) return t('warningMessage.thereIsOne', { condition: letters[0] });
    if (letters.length === 2) return t('warningMessage.thereAreTwoAnd', { first: letters[0], second: letters[1] });
    return t('warningMessage.thereAreMultiple', {
      conditions: letters.slice(0, -1).join(", "),
      last: letters[letters.length - 1]
    });
  };

  const conditions: string[] = [];
  if (gameMechanics.first) conditions.push(t('warningMessage.wordsHidden'));
  const letterCondition = getLetterConditions();
  if (letterCondition) conditions.push(letterCondition);

  const getFormattedText = () => {
    if (conditions.length === 0) return t('warningMessage.findAnagrams');
    return conditions.join(` ${t('warningMessage.and')} `);
  };

  const formatWithStyles = (text: string) => {
    return text.split(/(\s+)/).map((word, index) => {
      const cleanWord = word.replace(/,$/, '');
      const isComma = word.endsWith(',');

      let styledWord;
      if (cleanWord === t('warningMessage.fake')) styledWord = <span key={index} className="lost">{cleanWord}</span>;
      else if (cleanWord === t('warningMessage.hidden')) styledWord = <span key={index} className="highlight">{cleanWord}</span>;
      else if (cleanWord === t('warningMessage.dark')) styledWord = <span key={index} className="dark">{cleanWord}</span>;
      else if (cleanWord === t('warningMessage.hide')) styledWord = <span key={index} className="won">{cleanWord}</span>;
      else if (cleanWord === t('warningMessage.still')) styledWord = <span key={index} className="still">{cleanWord}</span>;
      else styledWord = cleanWord;

      return [
        styledWord,
        isComma ? <span key={`${index}-comma`}>, </span> : null
      ];
    }).flat();
  };

  return (
    <>
      <h4>
        {conditions.length > 0 && t('warningMessage.warning')}{formatWithStyles(getFormattedText())}
      </h4>
    </>
  );
}
