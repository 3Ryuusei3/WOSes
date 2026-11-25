import { LEVELS_TO_ADVANCE } from "../constant";

interface LevelStarsProps {
  levelsToAdvance: number;
}

const STAR = "12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.5 5.5 21 7.5 13.5 2 9 9 9";

/**
 * Stars for the level just passed: 1, 2 or 3 of 3 lit; a perfect round
 * gets 5 lit.
 */
export default function LevelStars({ levelsToAdvance }: LevelStarsProps) {
  const perfect = levelsToAdvance >= LEVELS_TO_ADVANCE.FIVE_STAR;
  const total = perfect ? 5 : 3;
  const lit = perfect ? 5 : Math.min(3, Math.max(0, levelsToAdvance));

  return (
    <div
      className={`level-stars level-stars--${total}`}
      role="img"
      aria-label={`${lit} / ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`level-stars__star ${i < lit ? "is-lit" : ""}`}
        >
          <polygon points={STAR} />
        </svg>
      ))}
    </div>
  );
}
