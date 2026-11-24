import { Dispatch, SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { getMechanicInfo } from "../constant/mechanics";
import closeIcon from "../assets/close.svg";

interface MechanicsModalProps {
  isOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  mechanicType: string;
}

/** Explains one letter type (fake, hidden, dark...) with an example. */
export default function MechanicsModal({
  isOpen,
  setModalOpen,
  mechanicType,
}: MechanicsModalProps) {
  const { t } = useTranslation();
  const handleClose = () => {
    setModalOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  const mechanicInfo = getMechanicInfo(mechanicType);

  return createPortal(
    <div className="modal open" onClick={handleClose} role="presentation">
      <div
        className="modal__content modal__content--steps"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={mechanicInfo?.label}
      >
        <button
          type="button"
          className="modal__close btn btn--lost btn--xs"
          onClick={handleClose}
          aria-label={t("common.close")}
        >
          <img src={closeIcon} alt="close" width={16} height={16} />
        </button>
        {mechanicInfo ? (
          <>
            <h2 className="won">{mechanicInfo.label}</h2>
            <div className="instruction-slide is-active">
              <h4 className="highlight">{mechanicInfo.description}</h4>
              {mechanicInfo.example}
              <h6 className="highlight">{mechanicInfo.show}</h6>
            </div>
          </>
        ) : (
          <>
            <h2>MECÁNICA DESCONOCIDA</h2>
            <div className="instruction-slide is-active">
              <h4 className="highlight">
                No hay información disponible para esta mecánica
              </h4>
            </div>
          </>
        )}
        <div className="modal__footer">
          <button
            type="button"
            onClick={handleClose}
            className="btn modal__primary"
          >
            {t("common.understood")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
