import { useTranslation } from "react-i18next";

interface LevelJumpProps {
  /** Level just played */
  from: number;
  /** Level to play next */
  to: number;
}

/**
 * How far the player moved: "NIVEL 3 → NIVEL 8" as two stickers and the
 * jump (+5) between them.
 */
export default function LevelJump({ from, to }: LevelJumpProps) {
  const { t } = useTranslation();
  const jump = to - from;

  return (
    <div className="level-jump" aria-label={`${t("lobby.youAdvanced")} ${jump}`}>
      <span className="level-jump__level">
        <small>{t("lobby.level")}</small>
        {from}
      </span>
      <span className="level-jump__arrow" aria-hidden="true">
        <span className="level-jump__plus">+{jump}</span>
        <svg viewBox="0 0 40 16">
          <path d="M2 8h32m-7-6 7 6-7 6" />
        </svg>
      </span>
      <span className="level-jump__level level-jump__level--next">
        <small>{t("lobby.level")}</small>
        {to}
      </span>
    </div>
  );
}
