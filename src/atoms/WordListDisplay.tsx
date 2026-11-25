import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Tooltip from "./Tooltip";
import Word from "../types/Word";
import { getDictionaryUrl } from "../utils";

interface WordListDisplayProps {
  lastLevelWords: Word[];
  columns: number;
  /** Multiplayer: words guessed by this player get their own colour */
  playerName?: string;
}

export default function WordListDisplay({
  lastLevelWords,
  columns,
  playerName,
}: WordListDisplayProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="v-section score__container--box">
      <Tooltip message={t("game.wordMeaning")}>
        <div className="info-icon">i</div>
      </Tooltip>
      <p>{t("common.lastWords")}</p>
      <div
        className="v-section score__container--wordlist"
        style={
          {
            "--wordlist-rows": Math.ceil(lastLevelWords.length / columns),
            "--wordlist-columns": columns,
          } as React.CSSProperties
        }
      >
        {lastLevelWords.map((word, index) => (
          <h4
            className={
              !word.guessed
                ? "unguessed"
                : playerName &&
                    word.guessedByName === playerName
                  ? "won"
                  : "highlight"
            }
            key={`${index}-${word}`}
          >
            <Link
              to={getDictionaryUrl(word.word, i18n.language)}
              target="_blank"
              rel="noreferrer"
            >
              {word.word.toUpperCase()}
            </Link>
          </h4>
        ))}
      </div>
    </div>
  );
}
