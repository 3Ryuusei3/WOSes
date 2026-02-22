import { useState, Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { submitWordRequest } from "../services/wordRequests";
import { showToast } from "./Toast";

interface WordFeedbackModalProps {
  isOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  originalWord: string;
  difficulty: string;
}

export default function WordFeedbackModal({
  isOpen,
  setModalOpen,
  originalWord,
  difficulty,
}: WordFeedbackModalProps) {
  const { t } = useTranslation();
  const [word, setWord] = useState("");
  const [action, setAction] = useState<"add" | "remove">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className={`modal ${isOpen ? "open" : ""}`}>
      <div className="modal__content">
        <div className="modal__close">
          <span className="" onClick={handleClose}>
            <h4 className="sr-only lost">ｘ</h4>
          </span>
        </div>
        <div className="v-section gap-md pos-rel">
          <h2 className="highlight">{t("wordFeedback.modalTitle")}</h2>
          <h4 className="highlight">{t("wordFeedback.modalDescription")}</h4>

          <div className="v-section gap-sm">
            <input
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
              className="btn"
            >
              {isSubmitting
                ? t("wordFeedback.submitting")
                : t("wordFeedback.submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
