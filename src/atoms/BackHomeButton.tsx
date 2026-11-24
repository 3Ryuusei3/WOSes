import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { requestExit } from "../utils/leaveToHome";

interface BackHomeButtonProps {
  /** Placement variant (see .back-control--* in index.scss) */
  className?: string;
}

/**
 * Back to the start screen (icon only, like the sound button). Each screen
 * puts it where it fits. The confirmation (ExitConfirmModal) is shared with
 * the browser's back button.
 */
export default function BackHomeButton({ className = "" }: BackHomeButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`back-control btn btn--sta btn--xs ${className}`}
      onClick={() => requestExit(navigate)}
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
  );
}
