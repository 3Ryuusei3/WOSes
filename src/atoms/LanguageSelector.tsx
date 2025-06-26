import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLanguage);
  };

  // Asegurar que el idioma esté definido correctamente
  const currentLanguage = i18n.language || 'es';

  return (
    <div className="language-selector">
      <button
        onClick={toggleLanguage}
        className="btn btn--sta btn--xs language-toggle"
      >
        {currentLanguage === 'es' ? 'ES' : 'EN'}
      </button>
    </div>
  );
}
