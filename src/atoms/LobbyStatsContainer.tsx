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
        label={t("common.levelPoints", { level: level - levelsToAdvance })}
        value={lastRoundPoints}
        size="sm"
      />
      <StatBox label={t("common.totalPoints")} value={totalPoints} size="sm" />
      <StatBox
        label={t("common.remainingTime")}
        value={`${gameTime}${t("common.seconds")}`}
        valueClassName={perfect ? "stat-good" : secondsToRemove > 0 ? "stat-bad" : ""}
        size="sm"
      />
      <StatBox
        label={t("common.numberOfRounds")}
        value={numberOfRounds}
        size="sm"
      />
      <StatBox
        label={t("common.perfectRounds")}
        value={numberOfPerfectRounds}
        valueClassName={perfect ? "stat-good" : ""}
        size="sm"
      />
    </div>
  );
}
