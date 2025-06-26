import { useState, Dispatch, SetStateAction } from "react";
import { useTranslation } from 'react-i18next';

import Instructions from './Instructions';
import arrowLeft from '../assets/arrow-left.svg';
import arrowRight from '../assets/arrow-right.svg';

interface HowToPlayModalProps {
  isOpen: boolean;
  setHowToPlayModal: Dispatch<SetStateAction<boolean>>;
}

export default function HowToPlayModal({ isOpen, setHowToPlayModal }: HowToPlayModalProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const instructions = Instructions();

  const handleClose = () => {
    setHowToPlayModal(false);
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev < instructions.length - 1 ? prev + 1 : prev);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev > 0 ? prev - 1 : prev);
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className='modal__content'>
        <div className='modal__close'>
          <span className='' onClick={handleClose}>
            <h4 className='sr-only lost'>ｘ</h4>
          </span>
        </div>
        <div className="instruction-slide__arrows">
          <img src={arrowLeft} alt="arrow-left" onClick={handlePrev} style={{ opacity: currentStep === 0 ? 0.5 : 1 }} />
          <img src={arrowRight} alt="arrow-right" onClick={handleNext} style={{ opacity: currentStep === instructions.length - 1 ? 0.5 : 1 }} />
        </div>
        <div className="v-section gap-md pos-rel">
          <h2 className="won">
            {currentStep === instructions.length - 1 ? t('howToPlay.ready') : t('howToPlay.title')}
          </h2>
          <div className="instruction-slide">
            {instructions[currentStep].content}
            {currentStep === instructions.length - 1 && (
              <button onClick={handleClose} className="btn--win mx-auto">
                {t('howToPlay.startNow')}
              </button>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}
