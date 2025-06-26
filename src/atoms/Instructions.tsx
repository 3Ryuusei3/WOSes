import { useTranslation } from 'react-i18next';
import { getLanguageConstants } from '../constant';

const Instructions = () => {
  const { t, i18n } = useTranslation();
  const { POINTS_PER_LETTER } = getLanguageConstants(i18n.language);

  const instructions = [
    {
      content: (
        <>
          <h4 className="highlight">{t('instructions.findAllWords')}</h4>
          <div className="selectedWord">
            <span className="selectedLetter">
              L
              <span className="letterPoints">{POINTS_PER_LETTER.l || 1}</span>
            </span>
            <span className="selectedLetter">
              I
              <span className="letterPoints">{POINTS_PER_LETTER.i || 1}</span>
            </span>
            <span className="selectedLetter">
              S
              <span className="letterPoints">{POINTS_PER_LETTER.s || 1}</span>
            </span>
            <span className="selectedLetter">
              Z
              <span className="letterPoints">{POINTS_PER_LETTER.z || 10}</span>
            </span>
            <span className="selectedLetter">
              A
              <span className="letterPoints">{POINTS_PER_LETTER.a || 1}</span>
            </span>
            <span className="selectedLetter">
              B
              <span className="letterPoints">{POINTS_PER_LETTER.b || 3}</span>
            </span>
            <span className="selectedLetter">
              A
              <span className="letterPoints">{POINTS_PER_LETTER.a || 1}</span>
            </span>
          </div>
        </>
      )
    },
    {
      content: (
        <>
          <h4 className="highlight">{t('instructions.wordsOrganized')}</h4>
          <div className="h-section gap-xs f-jc-c pos-rel w-fit mx-auto">
            <button className="btn--sm btn--win">{t('difficulties.easy')}</button>
            <button className="btn--sm">{t('difficulties.medium')}</button>
            <button className="btn--sm btn--lose">{t('difficulties.hard')}</button>
          </div>
        </>
      )
    },
    {
      content: (
        <div className="instruction-slide v-section gap-md">
          <h4 className="highlight">{t('instructions.example')}</h4>
          <div className="selectedWord">
            <span className="selectedLetter">
              B
              <span className="letterPoints">{POINTS_PER_LETTER.b || 3}</span>
            </span>
            <span className="selectedLetter">
              I
              <span className="letterPoints">{POINTS_PER_LETTER.i || 1}</span>
            </span>
            <span className="selectedLetter">
              L
              <span className="letterPoints">{POINTS_PER_LETTER.l || 1}</span>
            </span>
            <span className="selectedLetter">
              Z
              <span className="letterPoints">{POINTS_PER_LETTER.z || 10}</span>
            </span>
            <span className="selectedLetter">
              A
              <span className="letterPoints">{POINTS_PER_LETTER.a || 1}</span>
            </span>
            <span className="selectedLetter">
              A
              <span className="letterPoints">{POINTS_PER_LETTER.a || 1}</span>
            </span>
            <span className="selectedLetter">
              S
              <span className="letterPoints">{POINTS_PER_LETTER.s || 1}</span>
            </span>
          </div>
          <ul className="wordlist" style={{ '--wordlist-rows': 2 } as React.CSSProperties}>
            {i18n.language === 'es' ? (
              <>
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
                    <span className="letter">I</span>
                    <span className="letter">A</span>
                    <span className="letter">S</span>
                  </span>
                </li>
                <li className="word active">
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
                    <span className="letter">A</span>
                    <span className="letter">B</span>
                    <span className="letter">I</span>
                    <span className="letter">S</span>
                    <span className="letter">A</span>
                    <span className="letter">L</span>
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
              </>
            ) : (
              <>
                <li className="word active">
                  <span className="wordLetters">
                    <span className="letter">B</span>
                    <span className="letter">A</span>
                    <span className="letter">I</span>
                    <span className="letter">L</span>
                  </span>
                </li>
                <li className="word active">
                  <span className="wordLetters">
                    <span className="letter">B</span>
                    <span className="letter">A</span>
                    <span className="letter">S</span>
                    <span className="letter">I</span>
                    <span className="letter">L</span>
                  </span>
                </li>
                <li className="word active">
                  <span className="wordLetters">
                    <span className="letter">L</span>
                    <span className="letter">A</span>
                    <span className="letter">B</span>
                    <span className="letter">S</span>
                  </span>
                </li>
                <li className="word active">
                  <span className="wordLetters">
                    <span className="letter">B</span>
                    <span className="letter">A</span>
                    <span className="letter">S</span>
                    <span className="letter">A</span>
                    <span className="letter">L</span>
                  </span>
                </li>
                <li className="word active">
                  <span className="wordLetters">
                    <span className="letter">A</span>
                    <span className="letter">L</span>
                    <span className="letter">I</span>
                    <span className="letter">B</span>
                    <span className="letter">A</span>
                    <span className="letter">S</span>
                  </span>
                </li>
                <li className="word active">
                  <span className="wordLetters">
                    <span className="letter">B</span>
                    <span className="letter">A</span>
                    <span className="letter">I</span>
                    <span className="letter">L</span>
                    <span className="letter">S</span>
                  </span>
                </li>
              </>
            )}
          </ul>
        </div>
      )
    },
    {
      content: (
        <>
          <h4 className="highlight">{t('instructions.pointsSystem')}</h4>
          <div className="v-section gap-xs">
            <div className="wordlist" style={{ '--wordlist-rows': 1 } as React.CSSProperties}>
              <h4 className="lost">{t('instructions.lowPoints')}</h4>
              <h4 className="highlight">{t('instructions.mediumPoints')}</h4>
              <h4 className="won">{t('instructions.highPoints')}</h4>
            </div>
            <ul className="wordlist" style={{ '--wordlist-rows': 1 } as React.CSSProperties}>
              {i18n.language === 'es' ? (
                <>
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
                </>
              ) : (
                <>
                  <li className="word active">
                    <span className="wordLetters">
                      <span className="letter">B</span>
                      <span className="letter">A</span>
                      <span className="letter">I</span>
                      <span className="letter">L</span>
                    </span>
                  </li>
                  <li className="word active">
                    <span className="wordLetters">
                      <span className="letter">B</span>
                      <span className="letter">A</span>
                      <span className="letter">Z</span>
                      <span className="letter">A</span>
                      <span className="letter">S</span>
                    </span>
                  </li>
                  <li className="word active">
                    <span className="wordLetters">
                      <span className="letter">B</span>
                      <span className="letter">L</span>
                      <span className="letter">A</span>
                      <span className="letter">Z</span>
                      <span className="letter">E</span>
                      <span className="letter">S</span>
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </>
      )
    },
    {
      content: (
        <>
          <h4 className="highlight">{t('instructions.passLevel')}</h4>
          <div className="h-section gap-md f-ai-c">
            <div className="v-section gap-xs">
              <div className="selectedWord">
                <span className="selectedLetter common">
                  A
                  <span className="letterPoints">{POINTS_PER_LETTER.a || 1}</span>
                </span>
                <span className="selectedLetter">
                  B
                  <span className="letterPoints">{POINTS_PER_LETTER.b || 3}</span>
                </span>
                <span className="selectedLetter">
                  A
                  <span className="letterPoints">{POINTS_PER_LETTER.a || 1}</span>
                </span>
                <span className="selectedLetter common">
                  C
                  <span className="letterPoints">{POINTS_PER_LETTER.c || 3}</span>
                </span>
              </div>
            </div>
            <div className='score__container--box f-jc-c'>
              <h6 className="won">{t('instructions.extraTime')}</h6>
              <h6 className="won">{t('instructions.commonLetters')}</h6>
            </div>
          </div>
        </>
      )
    },
    {
      content: (
        <>
          <h4 className="highlight">{t('instructions.newChallenges')}</h4>
          <div className="selectedWord">
            <span className="selectedLetter">
              A
              <span className="letterPoints">{POINTS_PER_LETTER.a || 1}</span>
            </span>
            <span className="selectedLetter common">
              A
              <span className="letterPoints">{POINTS_PER_LETTER.a || 1}</span>
            </span>
            <span className="selectedLetter fake">
              S
              <span className="letterPoints">{POINTS_PER_LETTER.s || 1}</span>
            </span>
            <span className="selectedLetter">
              B
              <span className="letterPoints">{POINTS_PER_LETTER.b || 3}</span>
            </span>
            <span className="selectedLetter hidden">
              ?
              <span className="letterPoints">1</span>
            </span>
            <span className="selectedLetter still">
              I
              <span className="letterPoints">{POINTS_PER_LETTER.i || 1}</span>
            </span>
            <span className="selectedLetter dark">
              L
              <span className="letterPoints">{POINTS_PER_LETTER.l || 1}</span>
            </span>
          </div>
        </>
      )
    },
    {
      content: (
        <>
          <h4 className="highlight">{t('instructions.startPlaying')}</h4>
        </>
      )
    }
  ];

  return instructions;
};

export default Instructions;
