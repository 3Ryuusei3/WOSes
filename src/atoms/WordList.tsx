import { useEffect, useRef } from "react";

import Word from "../types/Word";
import hitSound from "../assets/hit.mp3";
import useGameStore from "../store/useGameStore";
import Mechanics from "../types/Mechanics";
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
