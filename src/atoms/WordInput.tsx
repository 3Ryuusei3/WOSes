import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";

import useInputResponse from "../hooks/useInputResponse";
import useMobileUserAgent from "../hooks/useMobileUserAgent";

export type WordInputHandle = {
  /** Focus the input (on mobile this opens the device keyboard) */
  focus: () => void;
};

interface WordInputProps {
  inputWord: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  possibleWords: string[];
  correctWords: string[];
  percentage: number;
  volume: number;
}

const WordInput = forwardRef<WordInputHandle, WordInputProps>(
  function WordInput(
    {
      inputWord,
      handleChange,
      handleKeyDown,
      possibleWords,
      correctWords,
      percentage,
      volume,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const isMobile = useMobileUserAgent();
    const { animateError, animateSuccess, animateRepeated, handleKeyDownWithShake } =
      useInputResponse(
        possibleWords,
        inputWord,
        correctWords,
        handleKeyDown,
        volume,
      );

    useImperativeHandle(
      ref,
      () => ({ focus: () => inputRef.current?.focus({ preventScroll: true }) }),
      [],
    );

    // Desktop: keep the input focused while the round runs
    useEffect(() => {
      if (percentage > 0 && !isMobile) {
        inputRef.current?.focus();
      }
    }, [percentage, isMobile]);

    // Mobile: take the focus at the start. The keyboard is already open if
    // the round was started with a tap (see primeMobileKeyboard).
    useEffect(() => {
      if (isMobile) inputRef.current?.focus({ preventScroll: true });
    }, [isMobile]);

    return (
      <input
        type="text"
        className={`mx-auto mt-auto ${animateError ? "animate-error" : ""} ${animateSuccess ? "animate-success" : ""} ${animateRepeated ? "animate-repeated" : ""}`}
        placeholder={t("game.inputWord")}
        value={inputWord}
        onChange={handleChange}
        onKeyDown={handleKeyDownWithShake}
        disabled={percentage === 0}
        ref={inputRef}
        autoFocus={!isMobile}
        // Device keyboard: "send" key, no corrections or capitals
        enterKeyHint="send"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
      />
    );
  },
);

export default WordInput;
