import { useState } from "react";
import { useTranslation } from "react-i18next";

import SegmentedTabs from "./SegmentedTabs";
import PlayersRanking from "./PlayersRanking";

type RankingView = "total" | "last";

/**
 * Room ranking for the host that also plays (no main screen): total score
 * or just the last round, switched with small tabs.
 */
export default function RoomRankingPanel() {
  const { t } = useTranslation();
  const [view, setView] = useState<RankingView>("total");

  return (
    <div className="v-section gap-md w100">
      <SegmentedTabs
        size="sm"
        tabs={[
          { key: "total", label: t("lobby.rankingTotal") },
          { key: "last", label: t("lobby.rankingLastRound") },
        ]}
        active={view}
        onChange={setView}
      />
      <PlayersRanking
        showTitle={false}
        sortBy={view === "total" ? "score" : "last_round_score"}
      />
    </div>
  );
}
