import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function VotingModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastClosed = localStorage.getItem('votingModalLastClosed');

    if (!lastClosed) {
      setIsOpen(true);
    } else {
      const lastClosedDate = new Date(parseInt(lastClosed));
      const currentDate = new Date();

      const diffTime = currentDate.getTime() - lastClosedDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays >= 1) {
        setIsOpen(true);
      }
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('votingModalLastClosed', Date.now().toString());
    setIsOpen(false);
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className='modal__content'>
        <div className='modal__close'>
          <span className='' onClick={handleClose}>
            <h4 className='sr-only lost'>ｘ</h4>
          </span>
        </div>
        <h2 className='highlight'>¿QUIERES AYUDAR A MEJORAR EL JUEGO?</h2>
        <h4 className='won'>ENTRA EN <Link to='https://woting.vercel.app/' className='link won' target='_blank'>WOTING.VERCEL.APP</Link> Y DA TU OPINIÓN SOBRE LAS PALABRAS DEL JUEGO</h4>
        <h2 className='highlight'>¡MUCHAS GRACIAS!</h2>
      </div>
    </div>
  );
}
