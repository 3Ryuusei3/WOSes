import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import closeIcon from "../assets/close.svg";

export default function VotingModal() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastClosed = localStorage.getItem("votingModalLastClosed");

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
    localStorage.setItem("votingModalLastClosed", Date.now().toString());
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="modal open">
      <div className="modal__content">
        <button
          type="button"
          className="modal__close btn btn--lost btn--xs"
          onClick={handleClose}
          aria-label={t("common.close")}
        >
          <img src={closeIcon} alt="close" width={16} height={16} />
        </button>
        <h2 className="highlight">¿QUIERES AYUDAR A MEJORAR EL JUEGO?</h2>
        <h4 className="won">
          ENTRA EN{" "}
          <Link
            to="https://woting.vercel.app/"
            className="link won"
            target="_blank"
          >
            WOTING.VERCEL.APP
          </Link>{" "}
          Y DA TU OPINIÓN SOBRE LAS PALABRAS DEL JUEGO
        </h4>
        <h2 className="highlight">¡MUCHAS GRACIAS!</h2>
      </div>
    </div>,
    document.body,
  );
}
