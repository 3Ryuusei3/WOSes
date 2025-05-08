import { getDifficultyLabel } from "../utils";

import Difficulty from "../types/Difficulty";

interface DifficultyTagProps {
  gameDifficulty: Difficulty;
}

export default function DifficultyTag({ gameDifficulty }: DifficultyTagProps) {
  return (
    <button className={`btn btn--xs mx-auto ${gameDifficulty === 'easy' ? 'btn--win' : gameDifficulty === 'hard' ? 'btn--lose' : ''}`}>{getDifficultyLabel(gameDifficulty)}</button>
  );
}
