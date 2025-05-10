import { Dispatch, SetStateAction } from "react";
import { getMechanicInfo } from "../constant/mechanics";

interface MechanicsModalProps {
  isOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  mechanicType: string;
}

export default function MechanicsModal({ isOpen, setModalOpen, mechanicType }: MechanicsModalProps) {
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
            <h4 className="highlight">No hay información disponible para esta mecánica</h4>
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

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className='modal__content'>
        <div className='modal__close'>
          <span className='' onClick={handleClose}>
            <h4 className='sr-only lost'>ｘ</h4>
          </span>
        </div>
        <div className="v-section gap-md pos-rel">
          {getMechanicInstructions()}
          <button onClick={handleClose} className="btn mx-auto">
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>
  );
}
