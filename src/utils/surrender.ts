import i18n from "i18next";

import useGameStore from "../store/useGameStore";
import { insertScoreWithNextId } from "../services/rooms";

/** Solo game in progress (playing, lobby or countdown): it can be given up
 *  and saved to the ranking instead of just abandoned */
export function canSurrender(): boolean {
  const s = useGameStore.getState();
  if (s.players !== "single") return false;
  if (s.mode === "game") return true;
  // Between levels: only once there's something to save
  return (s.mode === "lobby" || s.mode === "loading") && s.totalPoints > 0;
}

/**
 * "Rendirse": the game ends now and is saved as it is (ranking), then the
 * end screen. While playing, GameScreen does it (it has the round's words
 * and points); between levels the score is already complete.
 */
export function surrender() {
  const s = useGameStore.getState();
  s.setExitConfirmOpen(false);
  if (s.mode === "game") {
    s.requestSurrender();
    return;
  }
  void insertScoreWithNextId(
    s.playerName,
    s.totalPoints,
    s.level,
    s.gameDifficulty,
    i18n.language,
    new Date().toISOString(),
    s.numberOfRounds,
    s.numberOfPerfectRounds,
  )
    .then(({ error }) => {
      if (error) console.error("Error inserting highscore:", error);
    })
    .catch((error) => console.error("Error inserting highscore:", error));
  s.setPreviousRoundsWords([]);
  s.setMode("lost");
}
