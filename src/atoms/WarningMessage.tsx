import Difficulty from "../types/Difficulty";

interface WarningMessageProps {
  gameDifficulty: Difficulty;
}

export default function WarningMessage({ gameDifficulty }: WarningMessageProps) {
  const getLetterConditions = () => {
    const letters = [];
    if (gameDifficulty.fake) letters.push("FALSA");
    if (gameDifficulty.hidden) letters.push("OCULTA");
    if (gameDifficulty.dark) letters.push("OSCURA");

    if (letters.length === 0) return null;
    if (letters.length === 1) return `HAY UNA LETRA ${letters[0]}`;
    if (letters.length === 2) return `HAY UNA LETRA ${letters[0]} Y ${letters[1]}`;
    return `HAY UNA LETRA ${letters.slice(0, -1).join(", ")} Y ${letters[letters.length - 1]}`;
  };

  const conditions: string[] = [];
  if (gameDifficulty.first) conditions.push("LAS PALABRAS SE OCULTAN");
  const letterCondition = getLetterConditions();
  if (letterCondition) conditions.push(letterCondition);

  const getFormattedText = () => {
    if (conditions.length === 0) return "¡ENCUENTRA ANAGRAMAS!";
    return conditions.join(" Y ");
  };

  const formatWithStyles = (text: string) => {
    return text.split(/(\s+)/).map((word, index) => {
      const cleanWord = word.replace(/,$/, '');
      const isComma = word.endsWith(',');

      let styledWord;
      if (cleanWord === "FALSA") styledWord = <span key={index} className="lost">{cleanWord}</span>;
      else if (cleanWord === "OCULTA") styledWord = <span key={index} className="highlight">{cleanWord}</span>;
      else if (cleanWord === "OSCURA") styledWord = <span key={index} className="dark">{cleanWord}</span>;
      else if (cleanWord === "OCULTAN") styledWord = <span key={index} className="won">{cleanWord}</span>;
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
        {conditions.length > 0 && "¡CUIDADO! "}{formatWithStyles(getFormattedText())}
      </h4>
    </>
  );
}
