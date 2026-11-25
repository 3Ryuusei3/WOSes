import { useLayoutEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getLanguageConstants } from "../constant";

import ShuffledWordObjectType from "../types/ShuffledWordObject";
import Mechanics from "../types/Mechanics";

interface SelectedWordProps {
  shuffledWordObject: ShuffledWordObjectType[];
  percentage: number;
  gameMechanics: Mechanics;
  SHOW_LETTERS_PERCENTAGE: number;
}

export default function SelectedWord({
  shuffledWordObject,
  percentage,
  gameMechanics,
  SHOW_LETTERS_PERCENTAGE,
}: SelectedWordProps) {
  const { i18n } = useTranslation();
  const { POINTS_PER_LETTER } = getLanguageConstants(i18n.language);

  const getLetterClasses = (letter: ShuffledWordObjectType) => {
    const classes = ["selectedLetter"];

    if (letter.isDark && gameMechanics.dark) {
      if (percentage < SHOW_LETTERS_PERCENTAGE) {
        classes.push("dark-outline");
      } else {
        classes.push("dark");
      }
    }

    if (letter.isFake && percentage < SHOW_LETTERS_PERCENTAGE) {
      classes.push("fake");
    }

    if (letter.isHidden && gameMechanics.hidden) {
      classes.push("hidden");
    }

    if (
      letter.isCommon &&
      (!letter.isDark || percentage < SHOW_LETTERS_PERCENTAGE)
    ) {
      classes.push("common");
    }

    if (letter.isStill && gameMechanics.still) {
      classes.push("still");
    }

    if (
      letter.isMirrored &&
      gameMechanics.mirrored &&
      percentage > SHOW_LETTERS_PERCENTAGE
    ) {
      classes.push("mirrored");
    }

    return classes.join(" ");
  };

  const getDisplayLetter = (letter: ShuffledWordObjectType) => {
    if (
      letter.isHidden &&
      gameMechanics.hidden &&
      percentage > SHOW_LETTERS_PERCENTAGE
    ) {
      return "?";
    }
    return letter.letter;
  };

  // Stable identity per tile (letter + its occurrence; the fake one apart),
  // so a shuffle moves the same tiles instead of rebuilding them
  const tiles = useMemo(() => {
    const seen: Record<string, number> = {};
    return shuffledWordObject.map((letter) => {
      const base = `${letter.isFake ? "fake:" : ""}${letter.letter}`;
      seen[base] = (seen[base] ?? 0) + 1;
      return { letter, key: `${base}#${seen[base]}` };
    });
  }, [shuffledWordObject]);

  // Shuffle animation (FLIP): each tile starts where it was and hops to its
  // new place. Uses offsetLeft (layout position: ignores the tilt and the
  // flip animations) and the `translate` / `scale` properties (free from
  // `transform`, which the flip animations use).
  const tileRefs = useRef(new Map<string, HTMLSpanElement>());
  const lastLeft = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const now = new Map<string, number>();
    tileRefs.current.forEach((el, key) => now.set(key, el.offsetLeft));
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let order = 0;
    now.forEach((left, key) => {
      const before = lastLeft.current.get(key);
      const el = tileRefs.current.get(key);
      if (before === undefined || !el || reduced) return;
      const dx = before - left;
      if (Math.abs(dx) < 1) return;
      // Each tile hops along an arc (higher the further it goes), a moment
      // after the previous one, and lands with a small squash
      const lift = -Math.min(1.6, 0.6 + Math.abs(dx) / el.offsetWidth / 3);
      el.animate?.(
        [
          { translate: `${dx}px 0`, scale: "1" },
          {
            translate: `${dx / 2}px ${lift * el.offsetHeight * 0.35}px`,
            scale: "1.08",
            offset: 0.45,
          },
          { translate: "0 0", scale: "1.04 0.94", offset: 0.85 },
          { translate: "0 0", scale: "1" },
        ],
        {
          duration: 520,
          delay: order * 35,
          easing: "cubic-bezier(0.33, 0, 0.25, 1)",
          fill: "backwards",
        },
      );
      order += 1;
    });
    lastLeft.current = now;
  }, [tiles]);

  return (
    <div
      className="selectedWord"
      style={{ "--count": shuffledWordObject.length } as React.CSSProperties}
    >
      {tiles.map(({ letter, key }) => (
        <span
          key={key}
          ref={(el) => {
            if (el) tileRefs.current.set(key, el);
            else tileRefs.current.delete(key);
          }}
          className={getLetterClasses(letter)}
        >
          {getDisplayLetter(letter)}
          <span className="letterPoints">
            {POINTS_PER_LETTER[
              letter.letter as keyof typeof POINTS_PER_LETTER
            ] || 1}
          </span>
        </span>
      ))}
    </div>
  );
}
