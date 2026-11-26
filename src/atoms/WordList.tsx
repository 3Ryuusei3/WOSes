import { useEffect, useRef } from "react";

import Word from "../types/Word";
import hitSound from "../assets/hit.mp3";
import useGameStore from "../store/useGameStore";
import Mechanics from "../types/Mechanics";
import useMobileLayout from "../hooks/useMobileLayout";
import { playSound, preloadSound } from "../utils/sound";

interface WordListProps {
  words: Word[];
  playerName: string;
  percentage: number;
  gameMechanics: Mechanics;
  SHOW_LETTERS_PERCENTAGE: number;
}

export default function WordList({
  words,
  playerName,
  percentage,
  gameMechanics,
  SHOW_LETTERS_PERCENTAGE,
}: WordListProps) {
  const { players, role, volume, hostPlays } = useGameStore();
  const prevGuessedCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio(hitSound);
    preloadSound(hitSound);
  }, []);

  useEffect(() => {
    const guessedCount = words.filter((w) => w.guessed).length;
    if (guessedCount > prevGuessedCountRef.current) {
      const effectiveVol =
        players === "multi" && role === "player" ? 0 : volume;
      if (audioRef.current) {
        audioRef.current.volume = effectiveVol;
        if (effectiveVol > 0) {
          audioRef.current.currentTime = 0;
          playSound(audioRef.current);
        }
      }
    }
    prevGuessedCountRef.current = guessedCount;
  }, [words, players, role, volume]);
  const wordRefs = useRef<(HTMLLIElement | null)[]>([]);
  // Layout (phones and narrow windows): no names on the rows
  const isMobile = useMobileLayout();
  // Always 3 equal columns (phone and desktop): the board never reflows
  // while words are found
  const columns = 3;
  const showNames = players === "multi" && !isMobile;

  return (
    <ul
      className={`wordlist ${showNames ? "wordlist--names" : ""}`}
      style={
        {
          "--wordlist-rows": Math.ceil(words.length / columns),
          "--wordlist-columns": columns,
          // Same tile size for every word: based on the longest one
          "--letters": Math.max(1, ...words.map((w) => w.word.length)),
          // Phones: each column as wide as its longest word, so the tiles
          // can share the whole width (sum of those longest words)
          "--sum-letters": columnLetters(words, columns),
        } as React.CSSProperties
      }
    >
      {words.map((wordObj, index) => (
        <li
          key={`${index}-${wordObj.word}`}
          className={`word ${wordObj.guessed ? "active" : ""} ${
            // Rooms, for those who play: words someone else found look
            // different from yours (the host's main screen shows them all
            // the same)
            players === "multi" &&
            (role === "player" || hostPlays) &&
            wordObj.guessed &&
            wordObj.guessedByName &&
            wordObj.guessedByName !== playerName
              ? "word--other"
              : ""
          }`}
          ref={(el) => (wordRefs.current[index] = el)}
        >
          {/* Who guessed it: rooms on desktop (the host's screen). The slot
              is there on every row, so rows don't grow when a name appears */}
          {showNames && (
            <span className="playerName">
              {wordObj.guessed ? wordObj.guessedByName || playerName : ""}
            </span>
          )}
          <span className="wordLetters">
            {wordObj.word.split("").map((letter, letterIndex) => (
              <span
                key={`${index}-${wordObj.word}-${letter}-${letterIndex}`}
                className="letter"
              >
                <span>
                  {gameMechanics.first &&
                  percentage > SHOW_LETTERS_PERCENTAGE &&
                  letterIndex >= 1
                    ? "?"
                    : letter}
                </span>
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Sum, over the columns, of each column's longest word (column-major). */
function columnLetters(words: Word[], columns: number): number {
  const rows = Math.max(1, Math.ceil(words.length / columns));
  let sum = 0;
  for (let c = 0; c < columns; c++) {
    const col = words.slice(c * rows, (c + 1) * rows);
    if (col.length) sum += Math.max(...col.map((w) => w.word.length));
  }
  return Math.max(1, sum);
}
