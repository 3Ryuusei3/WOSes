import { useTranslation } from "react-i18next";

import useGameStore from "../store/useGameStore";

import soundOffIcon from "./../assets/speaker-off.svg";
import soundLowIcon from "./../assets/speaker-low.svg";
import soundHighIcon from "./../assets/speaker-high.svg";

import { isMobileUserAgent } from "../utils/mobileUserAgent";

interface GameSoundProps {
  /** Placement variant (e.g. "volume-control--inline" next to the timer) */
  className?: string;
}

/**
 * Sound button. Desktop: off / low / high. Phones: just on / off — the
 * page can't change the volume there (iOS always plays at the device
 * volume), so "off" means nothing is played.
 */
export default function GameSound({ className = "" }: GameSoundProps) {
  const { t } = useTranslation();
  const { volume, setVolume, players, role } = useGameStore();
  const isPlayer = players === "multi" && role === "player";

  // Players in a room are always silent (sound is on the host's screen)
  if (isPlayer) return null;

  const isPhone = isMobileUserAgent();
  const volumeState = volume === 0 ? "off" : volume === 0.2 ? "low" : "high";

  const next = () => {
    if (isPhone) {
      setVolume(volume === 0 ? 0.4 : 0);
    } else if (volumeState === "high") {
      setVolume(0);
    } else if (volumeState === "off") {
      setVolume(0.2);
    } else {
      setVolume(0.4);
    }
  };

  const icon =
    volumeState === "off"
      ? soundOffIcon
      : isPhone || volumeState === "high"
        ? soundHighIcon
        : soundLowIcon;
  const label = volumeState === "off" ? t("common.soundOn") : t("common.soundOff");

  return (
    <button
      type="button"
      className={`volume-control btn btn--sta btn--xs ${className}`}
      onClick={next}
      aria-label={label}
      title={label}
      aria-pressed={volumeState !== "off"}
      // Mobile game: don't close the device keyboard
      onMouseDown={(e) => e.preventDefault()}
    >
      <img src={icon} width={28} height={28} alt="" />
    </button>
  );
}
