import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import Mechanics from "../types/Mechanics";
import ShuffledWordObjectType from "../types/ShuffledWordObject";

const ROW1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const ROW2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"];
const ROW3 = ["Z", "X", "C", "V", "B", "N", "M"];

function computeAllowedLetterKeys(
  shuffledWordObject: ShuffledWordObjectType[],
  gameMechanics: Mechanics,
  percentage: number,
  showLettersPercentage: number,
): Set<string> | null {
  if (percentage === 0) return null;
  if (percentage > showLettersPercentage) return null;
  const set = new Set<string>();
  for (const tile of shuffledWordObject) {
    if (tile.isFake) continue;
    if (
      tile.isHidden &&
      gameMechanics.hidden &&
      percentage > showLettersPercentage
    ) {
      continue;
    }
    set.add(tile.letter.toLowerCase());
  }
  return set;
}

interface MobileGameKeyboardProps {
  disabled?: boolean;
  value: string;
  onValueChange: (next: string) => void;
  onEnter: (currentValue: string) => void;
  shuffledWordObject: ShuffledWordObjectType[];
  gameMechanics: Mechanics;
  percentage: number;
  showLettersPercentage: number;
}

export default function MobileGameKeyboard({
  disabled,
  value,
  onValueChange,
  onEnter,
  shuffledWordObject,
  gameMechanics,
  percentage,
  showLettersPercentage,
}: MobileGameKeyboardProps) {
  const { t } = useTranslation();

  const allowedLetterSet = useMemo(
    () =>
      computeAllowedLetterKeys(
        shuffledWordObject,
        gameMechanics,
        percentage,
        showLettersPercentage,
      ),
    [shuffledWordObject, gameMechanics, percentage, showLettersPercentage],
  );

  const letterDisabled = (letter: string) => {
    if (disabled) return true;
    const ch = letter.toLowerCase();
    if (allowedLetterSet === null) return false;
    return !allowedLetterSet.has(ch);
  };

  const addLetter = (letter: string) => {
    if (letterDisabled(letter)) return;
    onValueChange((value + letter).toLowerCase());
  };

  const backspace = () => {
    if (disabled) return;
    onValueChange(value.slice(0, -1));
  };

  const send = () => {
    if (disabled) return;
    onEnter(value);
  };

  return (
    <div className="mobile-game-keyboard" role="group" aria-label="Keyboard">
      <div className="mobile-game-keyboard__row">
        {ROW1.map((letter) => (
          <button
            key={letter}
            type="button"
            className="mobile-game-keyboard__key"
            disabled={letterDisabled(letter)}
            onClick={() => addLetter(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="mobile-game-keyboard__row mobile-game-keyboard__row--offset">
        {ROW2.map((letter) => (
          <button
            key={letter}
            type="button"
            className="mobile-game-keyboard__key"
            disabled={letterDisabled(letter)}
            onClick={() => addLetter(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="mobile-game-keyboard__row mobile-game-keyboard__row--bottom-letters">
        <span className="mobile-game-keyboard__gap-left" aria-hidden />
        {ROW3.map((letter) => (
          <button
            key={letter}
            type="button"
            className="mobile-game-keyboard__key"
            disabled={letterDisabled(letter)}
            onClick={() => addLetter(letter)}
          >
            {letter}
          </button>
        ))}
        <button
          type="button"
          className="mobile-game-keyboard__key mobile-game-keyboard__key--backspace"
          disabled={disabled}
          onClick={backspace}
          aria-label={t("game.virtualKeyboardDelete")}
        >
          ⌫
        </button>
      </div>
      <div className="mobile-game-keyboard__row mobile-game-keyboard__row--send">
        <button
          type="button"
          className="mobile-game-keyboard__key mobile-game-keyboard__key--send"
          disabled={disabled}
          onClick={send}
          aria-label={t("game.virtualKeyboardSend")}
        >
          {t("game.virtualKeyboardSend")}
        </button>
      </div>
    </div>
  );
}
