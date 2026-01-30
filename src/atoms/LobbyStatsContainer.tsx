import { useTranslation } from "react-i18next";
import LobbyStatsRow from "./LobbyStatsRow";
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

  const timeClassName =
    levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR
      ? "won"
      : secondsToRemove > 0
        ? "lost"
        : "highlight";

  const perfectRoundsClassName =
    levelsToAdvance === LEVELS_TO_ADVANCE.FIVE_STAR ? "won" : "highlight";

  return (
    <div className="score__container--box f-jc-c">
      <div className="v-section gap-xs">
        <LobbyStatsRow
          label={t("common.levelPoints", { level: level - levelsToAdvance })}
          value={lastRoundPoints}
        />
        <LobbyStatsRow
          label={t("common.totalPoints")}
          value={totalPoints}
        />
        <LobbyStatsRow
          label={t("common.remainingTime")}
          value={`${gameTime}${t("common.seconds")}`}
          valueClassName={timeClassName}
        />
        <LobbyStatsRow
          label={t("common.numberOfRounds")}
          value={numberOfRounds}
        />
        <LobbyStatsRow
          label={t("common.perfectRounds")}
          value={numberOfPerfectRounds}
          valueClassName={perfectRoundsClassName}
        />
      </div>
    </div>
  );
}
