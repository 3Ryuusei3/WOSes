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
import { submitWordRequest, submitFeedback } from "../services/wordRequests";
import { showToast } from "./Toast";
import SegmentedTabs from "./SegmentedTabs";
import Word from "../types/Word";
import closeIcon from "../assets/close.svg";

interface WordFeedbackModalProps {
  isOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  lastLevelWords: Word[];
  difficulty: string;
  roomName?: string;
}

type FeedbackKind = "word" | "feedback";
const MAX_FEEDBACK_LENGTH = 1000;

/**
 * "¿Falta algo?": report a word (add / remove) or send general feedback
 * about the game. Both go to the `requests` table (type word / feedback).
 */
export default function WordFeedbackModal({
  isOpen,
  setModalOpen,
  lastLevelWords,
  difficulty,
  roomName,
}: WordFeedbackModalProps) {
  const { t } = useTranslation();
  const wordInputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<FeedbackKind>("word");
  const [word, setWord] = useState("");
  const [action, setAction] = useState<"add" | "remove">("add");
  const [message, setMessage] = useState("");
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
    setMessage("");
    setKind("word");
  };

  const handleSubmit = async () => {
    const isWord = kind === "word";
    if (isWord ? !word.trim() : !message.trim()) {
      showToast(
        t(
          isWord
            ? "wordFeedback.errorEmpty"
            : "wordFeedback.errorEmptyFeedback",
        ),
        "error",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = isWord
        ? await submitWordRequest({
            word: word.trim().toLowerCase(),
            difficulty,
            originalWord: originalWord.toLowerCase(),
            action,
            roomName,
          })
        : await submitFeedback({
            message: message.trim().slice(0, MAX_FEEDBACK_LENGTH),
            difficulty,
            roomName,
          });

      if (error) {
        showToast(t("wordFeedback.errorSubmit"), "error");
        console.error("Error submitting request:", error);
      } else {
        showToast(
          t(isWord ? "wordFeedback.success" : "wordFeedback.successFeedback"),
          "success",
        );
        handleClose();
      }
    } catch (err) {
      showToast(t("wordFeedback.errorSubmit"), "error");
      console.error("Error submitting request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    e.stopPropagation();
    // Enter sends from the word input; in the textarea it's a new line
    if (e.target !== wordInputRef.current || isSubmitting) return;
    e.preventDefault();
    void handleSubmit();
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="modal open"
      onKeyDown={handleModalKeyDown}
      onClick={handleClose}
    >
      <div
        className="modal__content modal__content--steps feedback-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("wordFeedback.title")}
      >
        <button
          type="button"
          className="modal__close btn btn--lost btn--xs"
          onClick={handleClose}
          aria-label={t("common.close")}
        >
          <img src={closeIcon} alt="close" width={16} height={16} />
        </button>
        <h2 className="won">{t("wordFeedback.title")}</h2>
        <SegmentedTabs
          tabs={[
            { key: "word", label: t("wordFeedback.tabWord") },
            { key: "feedback", label: t("wordFeedback.tabFeedback") },
          ]}
          active={kind}
          onChange={setKind}
        />

        {/* Both tabs stacked in the same space: the modal keeps the taller
            one's height, so it doesn't grow when switching */}
        <div className="feedback-modal__panels">
          <div
            className={`v-section gap-sm feedback-modal__body ${kind === "word" ? "is-active" : ""}`}
            aria-hidden={kind !== "word"}
          >
            <h4 className="highlight">{t("wordFeedback.modalDescription")}</h4>
            <input
              ref={wordInputRef}
              type="text"
              placeholder={t("wordFeedback.inputPlaceholder")}
              value={word}
              onChange={(e) => setWord(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
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

            <h6 className="highlight txt-center">
              {action === "remove"
                ? t("wordFeedback.removeWarning")
                : difficulty !== "hard"
                  ? t("wordFeedback.addWarningNotHard")
                  : t("wordFeedback.addWarningHard")}
            </h6>
          </div>
          <div
            className={`v-section gap-sm feedback-modal__body ${kind === "feedback" ? "is-active" : ""}`}
            aria-hidden={kind !== "feedback"}
          >
            <h4 className="highlight">
              {t("wordFeedback.feedbackDescription")}
            </h4>
            <textarea
              className="feedback-modal__textarea"
              placeholder={t("wordFeedback.feedbackPlaceholder")}
              value={message}
              maxLength={MAX_FEEDBACK_LENGTH}
              rows={5}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
            />
            <small className="feedback-modal__counter">
              {message.length}/{MAX_FEEDBACK_LENGTH}
            </small>
          </div>
        </div>

        <div className="modal__footer">
          <button onClick={handleClose} className="btn btn--sm btn--ghost">
            {t("wordFeedback.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn--sm modal__primary"
          >
            {isSubmitting
              ? t("wordFeedback.submitting")
              : t("wordFeedback.submit")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
