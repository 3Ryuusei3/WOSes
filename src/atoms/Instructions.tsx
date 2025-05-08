const instructions = [
  {
    content: (
      <>
        <h4 className="highlight">EN CADA NIVEL, DEBES ADIVINAR TODAS LAS PALABRAS QUE PUEDAN FORMARSE ANTES DE QUE ACABE EL TIEMPO</h4>
        <div className="selectedWord">
          <span className="selectedLetter">
            L
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter">
            I
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter">
            S
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter">
            Z
            <span className="letterPoints">10</span>
          </span>
          <span className="selectedLetter">
            A
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter">
            B
            <span className="letterPoints">3</span>
          </span>
          <span className="selectedLetter">
            A
            <span className="letterPoints">1</span>
          </span>
        </div>
      </>
    )
  },
  {
    content: (
      <>
        <h4 className="highlight">LAS PALABRAS SE ORGANIZAN POR DIFICULTADES SEGÚN LA FRECUENCIA DE USO PERCIBIDA POR LOS USUARIOS</h4>
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
      <div className="instruction-slide v-section gap-md">
        <h4 className="highlight">VEAMOS UN EJEMPLO</h4>
        <div className="selectedWord">
          <span className="selectedLetter">
            B
            <span className="letterPoints">3</span>
          </span>
          <span className="selectedLetter">
            I
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter">
            L
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter">
            Z
            <span className="letterPoints">10</span>
          </span>
          <span className="selectedLetter">
            A
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter">
            A
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter">
            S
            <span className="letterPoints">1</span>
          </span>
        </div>
        <ul className="wordlist" style={{ '--wordlist-rows': 2 } as React.CSSProperties}>
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
        </ul>
      </div>
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
        <h4 className="highlight">SUPERA EL MÍNIMO DE PUNTOS PARA PASAR DE NIVEL. SI ADIVINAS TODAS LAS PALABRAS, ¡OBTENDRÁS UNA AYUDA!</h4>
        <div className="h-section gap-md f-ai-c">
          <div className="v-section gap-xs">
            <div className="selectedWord">
              <span className="selectedLetter common">
                A
                <span className="letterPoints">1</span>
              </span>
              <span className="selectedLetter">
                B
                <span className="letterPoints">3</span>
              </span>
              <span className="selectedLetter">
                A
                <span className="letterPoints">1</span>
              </span>
              <span className="selectedLetter common">
                C
                <span className="letterPoints">1</span>
              </span>
            </div>
          </div>
          <div className='score__container--box f-jc-c'>
            <h5 className="won">+1s EXTRA</h5>
            <h5 className="won">2 LETRAS MÁS USADAS</h5>
          </div>
        </div>
      </>
    )
  },
  {
    content: (
      <>
        <h4 className="highlight">A MEDIDA QUE SUBAS DE NIVEL, ENCONTRARÁS NUEVOS RETOS...</h4>
        <div className="selectedWord">
          <span className="selectedLetter">
            A
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter common">
            A
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter fake">
            S
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter">
            B
            <span className="letterPoints">3</span>
          </span>
          <span className="selectedLetter hidden">
            ?
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter">
            I
            <span className="letterPoints">1</span>
          </span>
          <span className="selectedLetter dark">
            L
            <span className="letterPoints">1</span>
          </span>
        </div>
      </>
    )
  },
  {
    content: (
      <>
        <h4 className="highlight">COMIENZA A JUGAR AHORA Y DESCÚBRELOS TODOS. ¿LISTO PARA DOMINAR EL VOCABULARIO?</h4>
      </>
    )
  }
];

export default instructions;
