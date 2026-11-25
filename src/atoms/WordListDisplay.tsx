import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Tooltip from "./Tooltip";
import Word from "../types/Word";
import useGameStore from "../store/useGameStore";
import useMobileLayout from "../hooks/useMobileLayout";
import { getDictionaryUrl } from "../utils";

interface WordListDisplayProps {
  lastLevelWords: Word[];
  columns: number;
  /** Multiplayer: words guessed by this player get their own colour */
  playerName?: string;
}

/**
 * Last level's words, laid out like the game board (columns of letter
 * tiles): found ones lit, the rest revealed in muted letters. Each word
 * opens its dictionary entry.
 */
export default function WordListDisplay({
  lastLevelWords,
  columns,
  playerName,
}: WordListDisplayProps) {
  const { t, i18n } = useTranslation();
  const { role, hostPlays } = useGameStore();
  const isMobile = useMobileLayout();
  // Someone else's words in white only for those who play (a host's main
  // screen shows every found word the same)
  const markOthers = !!playerName && (role === "player" || hostPlays);
  const maxLetters = Math.max(1, ...lastLevelWords.map((w) => w.word.length));

  return (
    <div className="v-section score__container--box word-review">
      <Tooltip message={t("game.wordMeaning")}>
        <div className="info-icon">i</div>
      </Tooltip>
      <p>{t("common.lastWords")}</p>
      <ul
        className="wordlist wordlist--review"
        style={
          {
            "--wordlist-rows": Math.ceil(lastLevelWords.length / columns),
            "--wordlist-columns": columns,
            "--letters": maxLetters,
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
                className={`word ${word.guessed ? "active" : "word--missed"} ${isOther ? "word--other" : ""}`}
                to={getDictionaryUrl(word.word, i18n.language)}
                target="_blank"
                rel="noreferrer"
                aria-label={word.word.toUpperCase()}
              >
                {word.guessed && word.guessedByName && !isMobile && (
                  <span className="playerName">{word.guessedByName}</span>
                )}
                <span className="wordLetters" aria-hidden="true">
                  {word.word.split("").map((letter, i) => (
                    <span key={i} className="letter">
                      <span>{letter}</span>
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
