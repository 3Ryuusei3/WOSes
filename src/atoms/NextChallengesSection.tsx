import { useTranslation } from "react-i18next";
import Tooltip from "./Tooltip";
import MechanicItem from "./MechanicItem";
import Mechanics from "../types/Mechanics";

interface NextChallengesSectionProps {
  gameMechanics: Mechanics | null;
  canAdvance: boolean;
  onMechanicClick: (mechanicKey: string) => void;
}

export default function NextChallengesSection({
  gameMechanics,
  canAdvance,
  onMechanicClick,
}: NextChallengesSectionProps) {
  const { t } = useTranslation();

  const areAllMechanicsFalse = gameMechanics
    ? Object.values(gameMechanics).every((value) => value === false)
    : false;

  return (
    <div className="v-section score__container--box">
      <p>{t("lobby.nextChallenges")}</p>
      {canAdvance && !areAllMechanicsFalse && (
        <Tooltip message={t("lobby.challengeTooltip")}>
          <div className="info-icon">i</div>
        </Tooltip>
      )}
      <div className="v-section">
        {!canAdvance ? (
          <h4 className="highlight">{t("common.loading")}</h4>
        ) : areAllMechanicsFalse ? (
          <h4
            className="won"
            dangerouslySetInnerHTML={{
              __html: t("lobby.noChallenges"),
            }}
          ></h4>
        ) : (
          <>
            {gameMechanics &&
              Object.entries(gameMechanics).map(
                ([key, value]) =>
                  value && (
                    <MechanicItem
                      key={key}
                      mechanicKey={key}
                      onClick={onMechanicClick}
                    />
                  ),
              )}
          </>
        )}
      </div>
    </div>
  );
}
