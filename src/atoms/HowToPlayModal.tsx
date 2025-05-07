import { useState, Dispatch, SetStateAction } from "react";
import arrowLeft from '../assets/arrow-left.svg';
import arrowRight from '../assets/arrow-right.svg';

interface HowToPlayModalProps {
  isOpen: boolean;
  setHowToPlayModal: Dispatch<SetStateAction<boolean>>;
}

const instructions = [
  {
    content: (
      <>
        <h4 className="highlight">WORDS ON STREAM EN ESPAÑOL ES UN JUEGO EN EL QUE DEBES ADIVINAR TODAS LAS PALABRAS QUE SE PUEDAN CREAR A PARTIR DE UN CONJUNTO DE LETRAS</h4>
      </>
    )
  },
  {
    content: (
      <>
        <h4 className="highlight">LAS PALABRAS SE ORGANIZAN POR NIVELES SEGÚN LA FRECUENCIA DE USO PERCIBIDA POR LOS USUARIOS</h4>
        <div className="h-section gap-xs f-jc-c pos-rel w-fit mx-auto">
          <button className="btn--sm btn--win">FÁCIL</button>
          <button className="btn--sm">ESTÁNDAR</button>
          <button className="btn--sm btn--lose">DIFÍCIL</button>
        </div>
      </>
    )
  },
  {
    content: (
      <>
        <h4 className="highlight">EN CADA NIVEL HAY UN CONJUNTO DE LETRAS AL AZAR. DEBES ENCONTRAR TODAS LAS PALABRAS POSIBLES</h4>
        <div className="selectedWord">
          <span className="selectedLetter">Z</span>
          <span className="selectedLetter">L</span>
          <span className="selectedLetter">I</span>
          <span className="selectedLetter">S</span>
          <span className="selectedLetter">A</span>
          <span className="selectedLetter">A</span>
          <span className="selectedLetter">B</span>
        </div>
      </>
    )
  },
  {
    content: (
      <div className="instruction-slide v-section gap-md">
        <div className="selectedWord">
          <span className="selectedLetter">L</span>
          <span className="selectedLetter">S</span>
          <span className="selectedLetter">I</span>
          <span className="selectedLetter">A</span>
          <span className="selectedLetter">B</span>
          <span className="selectedLetter">A</span>
          <span className="selectedLetter">Z</span>
        </div>
        <ul className="wordlist" style={{ '--wordlist-rows': 3 } as React.CSSProperties}>
          <li className="word active">
            <span className="wordLetters">
              <span className="letter">B</span>
              <span className="letter">A</span>
              <span className="letter">L</span>
              <span className="letter">A</span>
            </span>
          </li>
          <li className="word active">
            <span className="wordLetters">
              <span className="letter">L</span>
              <span className="letter">S</span>
              <span className="letter">I</span>
              <span className="letter">A</span>
            </span>
          </li>
          <li className="word active">
            <span className="wordLetters">
              <span className="letter">L</span>
              <span className="letter">I</span>
              <span className="letter">A</span>
              <span className="letter">S</span>
            </span>
          </li>
          <li className="word">
            <span className="wordLetters">
              <span className="letter">A</span>
              <span className="letter">I</span>
              <span className="letter">S</span>
              <span className="letter">L</span>
              <span className="letter">A</span>
            </span>
          </li>
          <li className="word active">
            <span className="wordLetters">
              <span className="letter">B</span>
              <span className="letter">A</span>
              <span className="letter">I</span>
              <span className="letter">L</span>
              <span className="letter">A</span>
            </span>
          </li>
          <li className="word active">
            <span className="wordLetters">
              <span className="letter">S</span>
              <span className="letter">A</span>
              <span className="letter">L</span>
              <span className="letter">I</span>
              <span className="letter">A</span>
            </span>
          </li>
          <li className="word active">
            <span className="wordLetters">
              <span className="letter">A</span>
              <span className="letter">B</span>
              <span className="letter">I</span>
              <span className="letter">S</span>
              <span className="letter">A</span>
              <span className="letter">L</span>
            </span>
          </li>
          <li className="word">
            <span className="wordLetters">
              <span className="letter">B</span>
              <span className="letter">A</span>
              <span className="letter">I</span>
              <span className="letter">L</span>
              <span className="letter">A</span>
              <span className="letter">S</span>
            </span>
          </li>
          <li className="word active">
            <span className="wordLetters">
              <span className="letter">S</span>
              <span className="letter">I</span>
              <span className="letter">L</span>
              <span className="letter">A</span>
              <span className="letter">B</span>
              <span className="letter">A</span>
            </span>
          </li>
        </ul>
      </div>
    )
  },
  {
    content: (
      <>
        <h4 className="highlight">LAS PALABRAS DEBEN TENER ENTRE 4 Y 10 LETRAS Y DEBEN APARECER EN EL DICCIONARIO. NO LLEVAN ACENTOS.</h4>
        <div className="v-section gap-xs">
          <div className="wordlist" style={{ '--wordlist-rows': 1 } as React.CSSProperties}>
            <h4 className="won">BIEN</h4>
            <h4 className="lost">MAL</h4>
            <h4 className="lost">MAL</h4>
          </div>
          <ul className="wordlist" style={{ '--wordlist-rows': 1 } as React.CSSProperties}>
            <li className="word active">
              <span className="wordLetters">
                <span className="letter">A</span>
                <span className="letter">L</span>
                <span className="letter">B</span>
                <span className="letter">A</span>
              </span>
            </li>
            <li className="word active">
              <span className="wordLetters">
                <span className="letter">S</span>
                <span className="letter">L</span>
                <span className="letter">A</span>
                <span className="letter">B</span>
              </span>
            </li>
            <li className="word active">
              <span className="wordLetters">
                <span className="letter">L</span>
                <span className="letter">S</span>
                <span className="letter">I</span>
                <span className="letter">A</span>
              </span>
            </li>
          </ul>
        </div>
      </>
    )
  },
  {
    content: (
      <>
        <h4 className="highlight">CADA PALABRA DA PUNTOS EN BASE A SU LONGITUD Y A LA FRECUENCIA DE USO DE SUS LETRAS</h4>
        <div className="v-section gap-xs">
          <div className="wordlist" style={{ '--wordlist-rows': 1 } as React.CSSProperties}>
            <h4 className="lost">7 PUNTOS</h4>
            <h4 className="highlight">14 PUNTOS</h4>
            <h4 className="won">17 PUNTOS</h4>
          </div>
          <ul className="wordlist" style={{ '--wordlist-rows': 1 } as React.CSSProperties}>
            <li className="word active">
              <span className="wordLetters">
                <span className="letter">B</span>
                <span className="letter">A</span>
                <span className="letter">I</span>
                <span className="letter">L</span>
                <span className="letter">A</span>
              </span>
            </li>
            <li className="word active">
              <span className="wordLetters">
                <span className="letter">A</span>
                <span className="letter">L</span>
                <span className="letter">Z</span>
                <span className="letter">A</span>
                <span className="letter">S</span>
              </span>
            </li>
            <li className="word active">
              <span className="wordLetters">
                <span className="letter">B</span>
                <span className="letter">A</span>
                <span className="letter">L</span>
                <span className="letter">I</span>
                <span className="letter">Z</span>
                <span className="letter">A</span>
              </span>
            </li>
          </ul>
        </div>
      </>
    )
  },
  {
    content: (
      <>
        <h4 className="highlight">A MEDIDA QUE SUBAS DE NIVEL, ENCONTRARÁS NUEVOS RETOS...</h4>
        <div className="selectedWord">
          <span className="selectedLetter common">A</span>
          <span className="selectedLetter fake">S</span>
          <span className="selectedLetter">A</span>
          <span className="selectedLetter hidden">?</span>
          <span className="selectedLetter">B</span>
          <span className="selectedLetter">I</span>
          <span className="selectedLetter dark">L</span>
        </div>
      </>
    )
  },
  {
    content: (
      <>
        <h4 className="highlight">¡EMPIEZA A JUGAR AHORA Y DESCÚBRELOS! ¿PREPARADO PARA CONQUISTAR EL VOCABULARIO?</h4>
      </>
    )
  }
];

export default function HowToPlayModal({ isOpen, setHowToPlayModal }: HowToPlayModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

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
          <h2 className="won">¡CÓMO JUGAR!</h2>
          <div className="instruction-slide">
            {instructions[currentStep].content}
            {currentStep === instructions.length - 1 && (
              <button onClick={handleClose} className="btn--win mx-auto">
                ¡EMPEZAR A JUGAR!
              </button>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}
