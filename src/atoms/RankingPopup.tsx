import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import closeIcon from "../assets/close.svg";

import rankingIcon from "../assets/ranking.svg";

type RankingPopupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function RankingPopupModal({
  isOpen,
  onClose,
  children,
}: RankingPopupModalProps) {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="modal open" onClick={onClose} role="presentation">
      <div
        className="modal__content modal__content--ranking"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("common.ranking")}
      >
        <button
          type="button"
          className="modal__close btn btn--lost btn--xs"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label={t("common.close")}
        >
          <img src={closeIcon} alt="close" width={16} height={16} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

type MobileRankingOpenButtonProps = {
  onClick: () => void;
};

export function MobileRankingOpenButton({
  onClick,
}: MobileRankingOpenButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="ranking-btn btn btn--sta btn--xs language"
      onClick={onClick}
      aria-label={t("common.ranking")}
    >
      <img src={rankingIcon} alt="" width={28} height={28} />
    </button>
  );
}
