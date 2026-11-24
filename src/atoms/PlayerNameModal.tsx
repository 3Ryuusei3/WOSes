import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import closeIcon from "../assets/close.svg";
import userIcon from "../assets/user.svg";
import useGameStore from "../store/useGameStore";
import { isValidPlayerName } from "../utils";

/**
 * Asks for / edits the player name (saved on the device). While there's no
 * valid name it can't be dismissed: every mode needs one.
 */
export default function PlayerNameModal() {
  const { t } = useTranslation();
  const { playerName, setPlayerName, nameModalOpen, setNameModalOpen } =
    useGameStore();
  const [draft, setDraft] = useState(playerName);
  const [error, setError] = useState(false);
  const hasValidName = isValidPlayerName(playerName);

  useEffect(() => {
    if (nameModalOpen) {
      setDraft(playerName);
      setError(false);
    }
  }, [nameModalOpen, playerName]);

  if (!nameModalOpen) return null;

  const close = () => {
    if (hasValidName) setNameModalOpen(false);
  };

  const save = () => {
    const name = draft.trim().toUpperCase();
    if (!isValidPlayerName(name)) {
      setError(true);
      return;
    }
    setPlayerName(name);
    setNameModalOpen(false);
  };

  return createPortal(
    <div className="modal open" onClick={close} role="presentation">
      <div
        className="modal__content player-name-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("gameStart.nameTitle")}
      >
        {hasValidName && (
          <button
            type="button"
            className="modal__close btn btn--lost btn--xs"
            onClick={close}
            aria-label={t("common.close")}
          >
            <img src={closeIcon} alt="close" width={16} height={16} />
          </button>
        )}
        <span className="player-name-modal__avatar" aria-hidden="true">
          <img src={userIcon} alt="" />
        </span>
        <div className="v-section gap-2xs">
          <h2 className="won">{t("gameStart.nameTitle")}</h2>
          <p className="player-name-modal__hint">{t("gameStart.nameHint")}</p>
        </div>
        <div className="v-section gap-xs w100">
          <input
            type="text"
            placeholder={t("common.enterName")}
            value={draft}
            maxLength={10}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            onChange={(e) => {
              setError(false);
              setDraft(e.target.value.toUpperCase());
            }}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <small className={`txt-center lost ${error ? "" : "op-0"}`}>
            {t("gameStart.nameError")}
          </small>
        </div>
        <button type="button" className="btn w100" onClick={save}>
          {t("common.save")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
