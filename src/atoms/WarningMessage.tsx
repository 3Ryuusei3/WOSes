import Difficulty from "../types/Difficulty";

interface WarningMessageProps {
  gameDifficulty: Difficulty;
}

export default function WarningMessage({ gameDifficulty }: WarningMessageProps) {
  const getLetterConditions = () => {
    const letters = [];
    if (gameDifficulty.fake) {
      letters.push("FALSA");
    }
    if (gameDifficulty.hidden) {
      letters.push("OCULTA");
    }
    if (gameDifficulty.dark) {
      letters.push("OSCURA");
    }

    if (letters.length === 0) return null;
    if (letters.length === 1) return `HAY UNA LETRA ${letters[0]}`;
    if (letters.length === 2) return `HAY UNA LETRA ${letters[0]} ${' '}Y ${' '}${letters[1]}`;
    return `HAY UNA LETRA ${letters[0]}, ${letters[1]} ${' '}Y ${' '}${letters[2]}`;
  };

  const conditions: string[] = [];
  const letterCondition = getLetterConditions();
  if (letterCondition) {
    conditions.push(letterCondition);
  }

  if (gameDifficulty.hiddenWords) {
    conditions.push("LAS PALABRAS SE OCULTAN");
  }

  const getFormattedText = () => {
    if (conditions.length === 0) {
      return "ENCUENTRA ANAGRAMAS";
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    if (conditions.length === 2) {
      return `${conditions[0]} ${' '}Y ${' '}${conditions[1]}`;
    }

    return conditions.slice(0, -1).join(", ") + " Y " + conditions[conditions.length - 1];
  };

  const formatWithStyles = (text: string) => {
    return text
      .split(" ")
      .map((word, index) => {
        if (word === "FALSA") return <span key={index} className="lost">{word}</span>;
        if (word === "OCULTA") return <span key={index} className="highlight">{word}</span>;
        if (word === "OSCURA") return <span key={index} className="dark">{word}</span>;
        if (word === "OCULTAN") return <span key={index} className="won">{word}</span>;
        return word + " ";
      });
  };

  return (
    <>
      <h4>
        ¡CUIDADO! {formatWithStyles(getFormattedText())}
      </h4>
    </>
  );
}
