export interface DailyChallenge {
  id: number;
  challenge_number: number;
  word: string;
  difficulty: "easy" | "medium" | "hard";
  time_seconds: number;
  has_hidden_letter: boolean;
  has_fake_letter: boolean;
  has_dark_mode: boolean;
  has_still_mode: boolean;
  has_first_letter: boolean;
}

export interface DailyChallengeRankingEntry {
  name: string;
  score: number;
  time_elapsed: number; // Tiempo transcurrido en completar el reto
  created_at: string;
  is_first_attempt: boolean;
}

export default DailyChallenge;
