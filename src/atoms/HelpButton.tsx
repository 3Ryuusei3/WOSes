import { useTranslation } from "react-i18next";

interface HelpButtonProps {
  onClick: () => void;
}

export default function HelpButton({ onClick }: HelpButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      className="btn btn--deco btn--xs help-button"
      onClick={onClick}
      title={t("wordFeedback.buttonTitle")}
      aria-label={t("wordFeedback.buttonText")}
    >
      {/* Phones show only the "?" (see CSS) */}
      <span className="help-button__text">{t("wordFeedback.buttonText")}</span>
      <span className="help-button__icon" aria-hidden="true">
        ?
      </span>
    </button>
  );
}
