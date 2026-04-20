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

export default function MechanicsModal({
  isOpen,
  setModalOpen,
  mechanicType,
}: MechanicsModalProps) {
  const { t } = useTranslation();
  const handleClose = () => {
    setModalOpen(false);
  };

  const getMechanicInstructions = () => {
    const mechanicInfo = getMechanicInfo(mechanicType);

    if (!mechanicInfo) {
      return (
        <>
          <h2>MECÁNICA DESCONOCIDA</h2>
          <div className="instruction-slide">
            <h4 className="highlight">
              No hay información disponible para esta mecánica
            </h4>
          </div>
        </>
      );
    }

    return (
      <>
        <h2 className="won">{mechanicInfo.label}</h2>
        <div className="instruction-slide">
          <h3 className="highlight">{mechanicInfo.description}</h3>
          {mechanicInfo.example}
          <h6 className="highlight">{mechanicInfo.show}</h6>
        </div>
      </>
    );
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
        <div className="v-section gap-md pos-rel">
          {getMechanicInstructions()}
          <button onClick={handleClose} className="btn mx-auto">
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
