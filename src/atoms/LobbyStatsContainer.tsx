import { useTranslation } from "react-i18next";
import StatBox from "./StatBox";
import { LEVELS_TO_ADVANCE } from "../constant";

interface LobbyStatsContainerProps {
  level: number;
  levelsToAdvance: number;
  lastRoundPoints: number;
  totalPoints: number;
  gameTime: number;
  numberOfRounds: number;
  numberOfPerfectRounds: number;
  secondsToRemove: number;
}

/** Level summary as a row of stat tiles */
export default function LobbyStatsContainer({
  level,
  levelsToAdvance,
  lastRoundPoints,
  totalPoints,
  gameTime,
  numberOfRounds,
  numberOfPerfectRounds,
  secondsToRemove,
}: LobbyStatsContainerProps) {
  const { t } = useTranslation();
  const perfect = levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR;

  return (
    <div className="stat-grid">
      <StatBox
        accent="yellow"
        label={t("common.levelPoints", { level: level - levelsToAdvance })}
        value={lastRoundPoints}
        size="sm"
      />
      <StatBox
        accent="cyan"
        label={t("common.totalPoints")}
        value={totalPoints}
        delta={lastRoundPoints > 0 ? `+${lastRoundPoints}` : undefined}
        size="sm"
      />
      <StatBox
        accent="red"
        label={t("common.remainingTime")}
        value={`${gameTime}${t("common.seconds")}`}
        tone={perfect ? "good" : secondsToRemove > 0 ? "bad" : undefined}
        delta={
          perfect
            ? `+1${t("common.seconds")}`
            : secondsToRemove > 0
              ? `−${secondsToRemove}${t("common.seconds")}`
              : undefined
        }
        size="sm"
      />
      <StatBox
        accent="orange"
        label={t("common.numberOfRounds")}
        value={numberOfRounds}
        delta="+1"
        size="sm"
      />
      <StatBox
        accent="green"
        label={t("common.perfectRounds")}
        value={numberOfPerfectRounds}
        tone={perfect ? "good" : undefined}
        delta={perfect ? "+1" : undefined}
        size="sm"
      />
    </div>
  );
}
