import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import SegmentedTabs from "./SegmentedTabs";
import closeIcon from "../assets/close.svg";
import logo from "../assets/lexio-logo.svg";
import { ICONS } from "../utils/faIcons";
import {
  canPromptInstall,
  isAppleMobile,
  onInstallPromptChange,
  promptInstall,
} from "../utils/installPrompt";

type Platform = "ios" | "android";
type IconKey = keyof typeof ICONS;

interface InstallModalProps {
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

// Each platform's steps: the icon of the button to look for + its text
const STEPS: Record<Platform, IconKey[]> = {
  ios: ["compass", "share", "plus", "check"],
  android: ["globe", "dots", "download", "check"],
};

function Icon({ name }: { name: IconKey }) {
  const icon = ICONS[name];
  return (
    <svg viewBox={`0 0 ${icon.w} ${icon.h}`} aria-hidden="true">
      <path fill="currentColor" d={icon.d} />
    </svg>
  );
}

/**
 * "Descargar" (phones): how to add LEXIO to the home screen as an app, step
 * by step for iPhone / iPad and for Android. Opens on the user's platform;
 * where the browser allows it (Android Chrome), a button installs it at once.
 */
export default function InstallModal({ isOpen, setOpen }: InstallModalProps) {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<Platform>(
    isAppleMobile() ? "ios" : "android",
  );
  const [canInstall, setCanInstall] = useState(canPromptInstall());
  useEffect(() => onInstallPromptChange(() => setCanInstall(canPromptInstall())), []);

  if (!isOpen) return null;
  const close = () => setOpen(false);

  return createPortal(
    <div className="modal open" onClick={close} role="presentation">
      <div
        className="modal__content install-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${t("install.title")} LEXIO`}
      >
        <button
          type="button"
          className="modal__close btn btn--lost btn--xs"
          onClick={close}
          aria-label={t("common.close")}
        >
          <img src={closeIcon} alt="close" width={16} height={16} />
        </button>
        <h2 className="won install-modal__title">
          {t("install.title")}
          <img src={logo} alt="LEXIO" className="install-modal__logo" />
        </h2>
        <p className="install-modal__intro">{t("install.intro")}</p>
        <SegmentedTabs
          tabs={[
            { key: "ios", label: t("install.ios") },
            { key: "android", label: t("install.android") },
          ]}
          active={platform}
          onChange={setPlatform}
        />
        {platform === "android" && canInstall && (
          <button
            type="button"
            className="btn btn--win install-modal__now"
            onClick={() => void promptInstall().then((ok) => ok && close())}
          >
            {t("install.installNow")}
          </button>
        )}
        <ol className="install-steps">
          {STEPS[platform].map((icon, i) => (
            <li key={`${platform}-${i}`} className="install-steps__step">
              <span className="install-steps__num">{i + 1}</span>
              <span className="install-steps__icon">
                <Icon name={icon} />
              </span>
              <span
                className="install-steps__text"
                dangerouslySetInnerHTML={{
                  __html: t(`install.steps.${platform}.${i}`),
                }}
              />
            </li>
          ))}
        </ol>
        <div className="modal__footer">
          <button type="button" className="btn modal__primary" onClick={close}>
            {t("common.understood")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
