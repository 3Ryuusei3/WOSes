import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import useGameStore from "../store/useGameStore";
import { isInRoom, leaveToHome } from "../utils/leaveToHome";

/**
 * Confirmation before going back to the start screen (back button or the
 * browser's back). Says clearly when it means leaving a room.
 */
export default function ExitConfirmModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { exitConfirmOpen, setExitConfirmOpen, role, roomCode } =
    useGameStore();

  if (!exitConfirmOpen) return null;

  const inRoom = isInRoom();
  const close = () => setExitConfirmOpen(false);

  const title = inRoom ? t("game.leaveRoomTitle") : t("game.exitConfirmTitle");
  const text = !inRoom
    ? t("game.exitConfirmText")
    : role === "host"
      ? t("game.leaveRoomHost", { code: roomCode })
      : t("game.leaveRoomPlayer", { code: roomCode });
  const confirm = inRoom ? t("game.leaveRoomButton") : t("game.exit");

  return createPortal(
    <div className="modal open" onClick={close} role="presentation">
      <div
        className="modal__content back-home-modal"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="v-section gap-2xs">
          <h2 className="won">{title}</h2>
          <p className="back-home-modal__hint">{text}</p>
        </div>
        <div className="h-section gap-xs w100">
          <button type="button" className="btn btn--sta" onClick={close}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn btn--lose"
            onClick={() => leaveToHome(navigate)}
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
