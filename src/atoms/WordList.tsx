import { useEffect, useRef, useState } from "react";

import Word from "../types/Word";
import hitSound from "../assets/hit.mp3";
import useGameStore from "../store/useGameStore";
import Mechanics from "../types/Mechanics";

import useWindowSize from "../hooks/useWindowSize";

import { isMobileUserAgent } from "../utils/mobileUserAgent";
import useMobileLayout from "../hooks/useMobileLayout";
import { playSound } from "../utils/sound";

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
  const { players, role, volume } = useGameStore();
  const prevGuessedCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio(hitSound);
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
  const { columns: defaultColumns } = useWindowSize();
  const listRef = useRef<HTMLUListElement>(null);
  const bestColumns = useBestMobileColumns(listRef, words);
  const columns = bestColumns ?? defaultColumns;

  return (
    <ul
      ref={listRef}
      className="wordlist"
      style={
        {
          "--wordlist-rows": Math.ceil(words.length / columns),
          "--wordlist-columns": columns,
          // Same tile size for every word: based on the longest one
          "--letters": Math.max(1, ...words.map((w) => w.word.length)),
        } as React.CSSProperties
      }
    >
      {words.map((wordObj, index) => (
        <li
          key={`${index}-${wordObj.word}`}
          className={`word ${wordObj.guessed ? "active" : ""} ${
            // Mobile multiplayer: no names (no room), rows guessed by someone
            // else get a different highlight instead
            isMobile &&
            players === "multi" &&
            wordObj.guessed &&
            wordObj.guessedByName &&
            wordObj.guessedByName !== playerName
              ? "word--other"
              : ""
          }`}
          ref={(el) => (wordRefs.current[index] = el)}
        >
          {/* Who guessed it: desktop only (the host's screen) */}
          {wordObj.guessed && !isMobile && (
            <span className="playerName">
              {wordObj.guessedByName || playerName}
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

/**
 * Mobile game screen: the list has a fixed size (container-type: size, see
 * index.scss) and tiles grow to fill it. Pick the column count (2-4) that
 * gives the biggest tiles for this list's size, word count and word length.
 * Returns null when not applicable (desktop, or list sized by its content).
 */
function useBestMobileColumns(
  listRef: React.RefObject<HTMLUListElement>,
  words: Word[],
): number | null {
  const [best, setBest] = useState<number | null>(null);
  const count = words.length;
  const maxLetters = Math.max(1, ...words.map((w) => w.word.length));

  useEffect(() => {
    const el = listRef.current;
    if (!el || !isMobileUserAgent() || count === 0) return;

    const compute = () => {
      if (getComputedStyle(el).containerType !== "size") {
        setBest(null);
        return;
      }
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      // Mirrors the .mobile .wordlist / .letter sizes in index.scss
      const colGap = 0.5 * rem;
      const gap = 1; // px between letters
      const rowChrome = 5; // px: row padding + outline, top and bottom
      const maxTile = 1.75 * rem;
      // Below this the list scrolls instead of shrinking (see index.scss)
      const minTileByHeight = 0.6875 * rem;
      const rowGap = 1; // px, .wordlist row-gap on the mobile game screen

      let bestCols = 2;
      let bestTile = 0;
      for (const cols of [2, 3, 4]) {
        const colWidth = (width - (cols - 1) * colGap) / cols;
        const byWidth =
          (colWidth - (maxLetters - 1) * gap - 0.375 * rem) / maxLetters;
        const rows = Math.ceil(count / cols);
        const byHeight =
          (height - (rows - 1) * rowGap) / rows - rowChrome;
        const tile = Math.min(
          byWidth,
          Math.max(byHeight, minTileByHeight),
          maxTile,
        );
        // Only add columns when it clearly helps
        if (tile > bestTile + 1) {
          bestTile = tile;
          bestCols = cols;
        }
      }
      setBest(bestCols);
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [listRef, count, maxLetters]);

  return best;
}
