import React from 'react';
import Mechanics from "../types/Mechanics";

export type MechanicKey = keyof Mechanics;

export interface MechanicInfo {
  key: MechanicKey;
  label: string;
  cssClass: string;
  description: string;
  show: string;
  example: JSX.Element;
}

const MECHANICS_INFO: Record<MechanicKey, Omit<MechanicInfo, 'key'>> = {
  dark: {
    label: 'LETRA OSCURA',
    cssClass: 'dark',
    description: 'UNA DE LAS LETRAS ESTARÁ OSCURA SIN PODER VERSE. ESTA CAMBIARÁ CADA VEZ QUE LAS LETRAS SE REORGANICEN',
    show: "DESAPARECE TRAS UN TIEMPO",
    example: (
      <div className="selectedWord">
        <span className="selectedLetter">
          A
          <span className="letterPoints">1</span>
        </span>
        <span className="selectedLetter">
          B
          <span className="letterPoints">3</span>
        </span>
        <span className="selectedLetter dark">
          L
          <span className="letterPoints">1</span>
        </span>
        <span className="selectedLetter">
          A
          <span className="letterPoints">1</span>
        </span>
      </div>
    )
  },
  fake: {
    label: 'LETRA FALSA',
    cssClass: 'lost',
    description: 'UNA DE LAS LETRAS NO PERTENECE AL CONJUNTO ORIGINAL. NO PUEDE USARSE PARA FORMAR PALABRAS VÁLIDAS.',
    show: "SE MARCA EN ROJO TRAS UN TIEMPO",
    example: (
      <div className="selectedWord">
        <span className="selectedLetter">
          A
          <span className="letterPoints">1</span>
        </span>
        <span className="selectedLetter">
          B
          <span className="letterPoints">3</span>
        </span>
        <span className="selectedLetter fake">
          S
          <span className="letterPoints">1</span>
        </span>
        <span className="selectedLetter">
          A
          <span className="letterPoints">1</span>
        </span>
      </div>
    )
  },
  hidden: {
    label: 'LETRA OCULTA',
    cssClass: 'highlight',
    description: 'UNA DE LAS LETRAS ESTARÁ OCULTA Y DEBERÁS ADIVINARLA',
    show: "SE MUESTRA TRAS UN TIEMPO",
    example: (
      <div className="selectedWord">
        <span className="selectedLetter hidden">
          ?
          <span className="letterPoints">1</span>
        </span>
        <span className="selectedLetter">
          B
          <span className="letterPoints">3</span>
        </span>
        <span className="selectedLetter">
          L
          <span className="letterPoints">1</span>
        </span>
        <span className="selectedLetter">
          A
          <span className="letterPoints">1</span>
        </span>
      </div>
    )
  },
  first: {
    label: 'SOLO PRIMERA LETRA',
    cssClass: 'won',
    description: 'AL ACERTAR, SOLO VERÁS LA PRIMERA LETRA DE CADA PALABRA',
    show: "SE MUESTRAN TODAS LAS LETRAS TRAS UN TIEMPO",
    example: (
      <div className="wordlist" style={{ '--wordlist-rows': 2 } as React.CSSProperties}>
        <li className="word active">
          <span className="wordLetters">
            <span className="letter">B</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
          </span>
        </li>
        <li className="word active">
          <span className="wordLetters">
            <span className="letter">A</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
          </span>
        </li>
        <li className="word active">
          <span className="wordLetters">
            <span className="letter">L</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
          </span>
        </li>
        <li className="word active">
          <span className="wordLetters">
            <span className="letter">l</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
          </span>
        </li>
        <li className="word">
          <span className="wordLetters">
            <span className="letter">A</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
          </span>
        </li>
        <li className="word">
          <span className="wordLetters">
            <span className="letter">L</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
            <span className="letter">?</span>
          </span>
        </li>
      </div>
    )
  }
};

export const getMechanicInfo = (key: string): MechanicInfo | null => {
  const mechanicKey = key.toLowerCase() as MechanicKey;
  if (MECHANICS_INFO[mechanicKey]) {
    return {
      key: mechanicKey,
      ...MECHANICS_INFO[mechanicKey]
    };
  }
  return null;
};

export default MECHANICS_INFO;
