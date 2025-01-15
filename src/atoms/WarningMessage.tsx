interface WarningMessageProps {
  level: number;
  HIDDEN_LETTER_LEVEL_START: number;
  FAKE_LETTER_LEVEL_START: number;
  HIDDEN_WORDS_LEVEL_START: number;
}

export default function WarningMessage({ level, HIDDEN_LETTER_LEVEL_START, FAKE_LETTER_LEVEL_START, HIDDEN_WORDS_LEVEL_START }: WarningMessageProps) {
  return (
    <>
      {level >= HIDDEN_LETTER_LEVEL_START && level >= FAKE_LETTER_LEVEL_START && level >= HIDDEN_WORDS_LEVEL_START ? (
        <h4>¡CUIDADO! LAS PALABRAS SE <span className='won'>OCULTAN</span>, HAY UNA LETRA <span className="lost">FALSA</span> Y OTRA <span className="highlight">OCULTA</span></h4>
      ) : level >= HIDDEN_WORDS_LEVEL_START && level >= HIDDEN_LETTER_LEVEL_START ? (
        <h4>¡CUIDADO! LAS PALABRAS SE <span className='won'>OCULTAN</span> Y HAY UNA LETRA <span className="highlight">OCULTA</span></h4>
      ) : level >= HIDDEN_WORDS_LEVEL_START && level >= FAKE_LETTER_LEVEL_START ? (
        <h4>¡CUIDADO! LAS PALABRAS SE <span className='won'>OCULTAN</span> Y HAY UNA LETRA <span className="lost">FALSA</span></h4>
      ) : level >= HIDDEN_WORDS_LEVEL_START ? (
        <h4>¡CUIDADO! LAS PALABRAS SE <span className='won'>OCULTAN</span></h4>
      ) : level >= HIDDEN_LETTER_LEVEL_START && level >= FAKE_LETTER_LEVEL_START ? (
        <h4>¡CUIDADO! HAY UNA LETRA <span className="lost">FALSA</span> Y OTRA <span className="highlight">OCULTA</span></h4>
      ) : level >= HIDDEN_LETTER_LEVEL_START ? (
        <h4>¡CUIDADO! HAY UNA LETRA <span className="highlight">OCULTA</span></h4>
      ) : level >= FAKE_LETTER_LEVEL_START ? (
        <h4>¡CUIDADO! HAY UNA LETRA <span className="lost">FALSA</span></h4>
      ) : (
        <h4>ENCUENTRA ANAGRAMAS</h4>
      )}
    </>
  );
}
