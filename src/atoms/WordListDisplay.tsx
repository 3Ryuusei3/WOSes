import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Word from "../types/Word";
import useGameStore from "../store/useGameStore";
import { getDictionaryUrl } from "../utils";

interface WordListDisplayProps {
  lastLevelWords: Word[];
  columns: number;
  /** Multiplayer: words guessed by this player get their own colour */
  playerName?: string;
}

/**
 * Last level's words as plain words in columns: found ones lit, the rest
 * muted. Each one opens its dictionary entry (hint under the title).
 */
export default function WordListDisplay({
  lastLevelWords,
  columns,
  playerName,
}: WordListDisplayProps) {
  const { t, i18n } = useTranslation();
  const { role, hostPlays } = useGameStore();
  // Someone else's words in white only for those who play (a host's main
  // screen shows every found word the same)
  const markOthers = !!playerName && (role === "player" || hostPlays);

  return (
    <div className="v-section score__container--box word-review">
      <p>{t("common.lastWords")}</p>
      <small className="word-review__hint">{t("game.wordMeaningHint")}</small>
      <ul
        className="word-review__list"
        style={
          {
            "--wordlist-rows": Math.ceil(lastLevelWords.length / columns),
            "--wordlist-columns": columns,
          } as React.CSSProperties
        }
      >
        {lastLevelWords.map((word, index) => {
          const isOther =
            markOthers &&
            word.guessed &&
            !!word.guessedByName &&
            word.guessedByName !== playerName;
          return (
            <li key={`${index}-${word.word}`}>
              <Link
                className={`word-review__word ${word.guessed ? (isOther ? "is-other" : "is-found") : "is-missed"}`}
                to={getDictionaryUrl(word.word, i18n.language)}
                target="_blank"
                rel="noreferrer"
                title={t("game.wordMeaning")}
              >
                {word.word.toUpperCase()}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
