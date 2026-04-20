import {
  useState,
  useRef,
  Dispatch,
  SetStateAction,
  useMemo,
  KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { submitWordRequest } from "../services/wordRequests";
import { showToast } from "./Toast";
import Word from "../types/Word";
import closeIcon from "../assets/close.svg";
interface WordFeedbackModalProps {
  isOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  lastLevelWords: Word[];
  difficulty: string;
  roomName?: string;
}

export default function WordFeedbackModal({
  isOpen,
  setModalOpen,
  lastLevelWords,
  difficulty,
  roomName,
}: WordFeedbackModalProps) {
  const { t } = useTranslation();
  const wordInputRef = useRef<HTMLInputElement>(null);
  const [word, setWord] = useState("");
  const [action, setAction] = useState<"add" | "remove">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const originalWord = useMemo(() => {
    if (!lastLevelWords || lastLevelWords.length === 0) return "";
    const longestWord = lastLevelWords.reduce(
      (longest, current) =>
        current.word.length > longest.word.length ? current : longest,
      lastLevelWords[0],
    );
    return longestWord.word;
  }, [lastLevelWords]);

  const handleClose = () => {
    setModalOpen(false);
    setWord("");
    setAction("add");
  };

  const handleSubmit = async () => {
    if (!word.trim()) {
      showToast(t("wordFeedback.errorEmpty"), "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await submitWordRequest({
        word: word.trim().toLowerCase(),
        difficulty,
        originalWord: originalWord.toLowerCase(),
        action,
        roomName,
      });

      if (error) {
        showToast(t("wordFeedback.errorSubmit"), "error");
        console.error("Error submitting word request:", error);
      } else {
        showToast(t("wordFeedback.success"), "success");
        handleClose();
      }
    } catch (err) {
      showToast(t("wordFeedback.errorSubmit"), "error");
      console.error("Error submitting word request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    e.stopPropagation();
    if (e.target !== wordInputRef.current || isSubmitting) return;
    e.preventDefault();
    void handleSubmit();
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="modal open" onKeyDown={handleModalKeyDown}>
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
          <h2 className="highlight">{t("wordFeedback.modalTitle")}</h2>
          <h4 className="highlight">{t("wordFeedback.modalDescription")}</h4>

          <div className="v-section gap-sm">
            <input
              ref={wordInputRef}
              type="text"
              className="mx-auto"
              placeholder={t("wordFeedback.inputPlaceholder")}
              value={word}
              onChange={(e) => setWord(e.target.value)}
              disabled={isSubmitting}
            />

            <div className="custom-radio-group">
              <label className="custom-radio">
                <input
                  type="radio"
                  name="action"
                  value="add"
                  checked={action === "add"}
                  onChange={() => setAction("add")}
                  disabled={isSubmitting}
                />
                <span>{t("wordFeedback.actionAdd")}</span>
              </label>
              <label className="custom-radio">
                <input
                  type="radio"
                  name="action"
                  value="remove"
                  checked={action === "remove"}
                  onChange={() => setAction("remove")}
                  disabled={isSubmitting}
                />
                <span>{t("wordFeedback.actionRemove")}</span>
              </label>
            </div>

            {action === "remove" && (
              <h6 className="highlight txt-center">
                {t("wordFeedback.removeWarning")}
              </h6>
            )}

            {action === "add" && (
              <h6 className="highlight txt-center">
                {difficulty !== "hard"
                  ? t("wordFeedback.addWarningNotHard")
                  : t("wordFeedback.addWarningHard")}
              </h6>
            )}
          </div>

          <div className="h-section gap-xs f-jc-c">
            <button onClick={handleClose} className="btn btn--sm btn--lose">
              {t("wordFeedback.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn--sm"
            >
              {isSubmitting
                ? t("wordFeedback.submitting")
                : t("wordFeedback.submit")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
