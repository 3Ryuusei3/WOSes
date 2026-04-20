import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";

import useInputResponse from "../hooks/useInputResponse";
import useMobileUserAgent from "../hooks/useMobileUserAgent";

export type WordInputHandle = {
  applyValue: (next: string) => void;
  submitEnter: () => void;
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

    const applyValue = useCallback(
      (next: string) => {
        flushSync(() => {
          handleChange({
            target: { value: next },
          } as React.ChangeEvent<HTMLInputElement>);
        });
      },
      [handleChange],
    );

    const enterEvent = {
      key: "Enter",
      preventDefault: () => {},
      stopPropagation: () => {},
    } as React.KeyboardEvent<HTMLInputElement>;

    const submitEnter = useCallback(() => {
      handleKeyDownWithShake(enterEvent);
    }, [handleKeyDownWithShake]);

    useImperativeHandle(
      ref,
      () => ({
        applyValue,
        submitEnter,
      }),
      [applyValue, submitEnter],
    );

    useEffect(() => {
      if (percentage > 0 && !isMobile) {
        inputRef.current?.focus();
      }
    }, [percentage, isMobile]);

    return (
      <input
        type="text"
        className={`mx-auto mt-auto ${animateError ? "animate-error" : ""} ${animateSuccess ? "animate-success" : ""} ${animateRepeated ? "animate-repeated" : ""}`}
        placeholder={t("game.inputWord")}
        value={inputWord}
        onChange={handleChange}
        onKeyDown={handleKeyDownWithShake}
        disabled={percentage === 0}
        inputMode={isMobile ? "none" : undefined}
        ref={inputRef}
        autoFocus={!isMobile}
      />
    );
  },
);

export default WordInput;
