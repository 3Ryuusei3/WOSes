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
    >
      {t("wordFeedback.buttonText")}
    </button>
  );
}
