import { useState, Dispatch, SetStateAction, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import Instructions from "./Instructions";
import arrowLeft from "../assets/arrow-left.svg";
import arrowRight from "../assets/arrow-right.svg";
import closeIcon from "../assets/close.svg";

import useWindowSize from "../hooks/useWindowSize";

interface HowToPlayModalProps {
  isOpen: boolean;
  setHowToPlayModal: Dispatch<SetStateAction<boolean>>;
}

/**
 * Step-by-step instructions. All slides are rendered in the same grid cell
 * (only the current one visible), so the modal always has the height of the
 * tallest slide and nothing jumps when moving between them.
 */
export default function HowToPlayModal({
  isOpen,
  setHowToPlayModal,
}: HowToPlayModalProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const instructions = Instructions();
  const { columns } = useWindowSize();

  const isFirst = currentStep === 0;
  const isLast = currentStep === instructions.length - 1;

  const handleClose = () => {
    setHowToPlayModal(false);
    setCurrentStep(0);
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, instructions.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="modal open" onClick={handleClose} role="presentation">
      <div
        className="modal__content modal__content--steps"
        style={{ "--wordlist-columns": columns } as CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("howToPlay.title")}
      >
        <button
          type="button"
          className="modal__close btn btn--lost btn--xs"
          onClick={handleClose}
          aria-label={t("common.close")}
        >
          <img src={closeIcon} alt="close" width={16} height={16} />
        </button>
        <h2 className="won">
          {isLast ? t("howToPlay.ready") : t("howToPlay.title")}
        </h2>
        <div className="modal__steps">
          {instructions.map((instruction, index) => (
            <div
              key={index}
              className={`instruction-slide ${index === currentStep ? "is-active" : ""}`}
              aria-hidden={index !== currentStep}
            >
              {instruction.content}
            </div>
          ))}
        </div>
        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--sm modal__nav"
            onClick={handlePrev}
            disabled={isFirst}
            aria-label={t("common.previous")}
          >
            <img src={arrowLeft} alt="" />
          </button>
          <div className="modal__dots" aria-hidden="true">
            {instructions.map((_, index) => (
              <span
                key={index}
                className={`modal__dot ${index === currentStep ? "is-active" : ""}`}
              />
            ))}
          </div>
          {isLast ? (
            <button
              type="button"
              className="btn btn--sm btn--win"
              onClick={handleClose}
            >
              {t("howToPlay.startNow")}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--sm modal__nav"
              onClick={handleNext}
              aria-label={t("common.next")}
            >
              <img src={arrowRight} alt="" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
