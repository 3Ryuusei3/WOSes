import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import useGameStore from "../store/useGameStore";
import { clearRoomSession } from "../realtime/roomSession";
import { resetProgress } from "../hooks/useRoomSync";

interface BackHomeButtonProps {
  /** Placement variant (see .back-control--* in index.scss) */
  className?: string;
}

/**
 * Back to the start screen (icon only, like the sound button). Each screen
 * puts it where it fits. Asks first when something would be lost (a run in
 * progress, or leaving a room).
 */
export default function BackHomeButton({ className = "" }: BackHomeButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mode, players, role } = useGameStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isMulti = players === "multi" && !!role;
  // Single player: nothing to lose once the game is over
  const needsConfirm = isMulti || mode !== "lost";

  const goHome = () => {
    setConfirmOpen(false);
    const s = useGameStore.getState();
    if (s.players === "multi") clearRoomSession(s.roomCode);
    resetProgress();
    // Without a room useRoomSync leaves the realtime channel by itself
    s.setRole(null);
    s.setRoomCode("");
    s.setRoomId(null);
    s.setPlayerId(null);
    s.setPlayers("single");
    s.setDailyChallengeOriginalDifficulty(null);
    // Same tick: the start screen must not see the old ?id= in the URL
    navigate("/", { replace: true });
    s.setMode("start");
  };

  const handleClick = () => {
    if (needsConfirm) setConfirmOpen(true);
    else goHome();
  };

  const confirmText = !isMulti
    ? t("game.exitConfirmText")
    : role === "host"
      ? t("game.exitConfirmHost")
      : t("game.exitConfirmPlayer");

  return (
    <>
      <button
        type="button"
        className={`back-control btn btn--sta btn--xs ${className}`}
        onClick={handleClick}
        aria-label={t("game.backHome")}
        title={t("game.backHome")}
        // Mobile: don't close the device keyboard just by touching it
        onMouseDown={(e) => e.preventDefault()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M19 12H5m0 0 6 6m-6-6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {confirmOpen &&
        createPortal(
          <div
            className="modal open"
            onClick={() => setConfirmOpen(false)}
            role="presentation"
          >
            <div
              className="modal__content back-home-modal"
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-label={t("game.exitConfirmTitle")}
            >
              <div className="v-section gap-2xs">
                <h2 className="won">{t("game.exitConfirmTitle")}</h2>
                <p className="back-home-modal__hint">{confirmText}</p>
              </div>
              <div className="h-section gap-xs w100">
                <button
                  type="button"
                  className="btn btn--sta"
                  onClick={() => setConfirmOpen(false)}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className="btn btn--lose"
                  onClick={goHome}
                >
                  {t("game.exit")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
