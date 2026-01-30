import { useState } from "react";
import {
  getDailyChallenge,
  checkIfAlreadyPlayed,
} from "../services/dailyChallenge";
import useGameStore from "../store/useGameStore";
import DailyChallenge from "../types/DailyChallenge";

export default function useDailyChallenge() {
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  const {
    playerName,
    setPlayers,
    setGameDifficulty,
    setCurrentChallengeNumber,
    setDailyChallengeWord,
    setDailyChallengeOriginalDifficulty,
    setDailyChallengeInitialTime,
    setGameMechanics,
    setGameTime,
    setLevel,
    setTotalPoints,
    setNumberOfPerfectRounds,
    setNumberOfRounds,
    setPreviousRoundsWords,
    setMode,
  } = useGameStore();

  const loadDailyChallenge = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await getDailyChallenge();

      if (err || !data) {
        setError("No se pudo cargar el reto diario");
        return;
      }

      setDailyChallenge(data);

      if (playerName) {
        const played = await checkIfAlreadyPlayed(
          playerName,
          data.challenge_number,
        );
        setAlreadyPlayed(played);
      }
    } catch (err) {
      setError("Error cargando reto diario");
    } finally {
      setLoading(false);
    }
  };

  const startDailyChallenge = () => {
    if (!dailyChallenge) return;

    setPlayers("single");
    setGameDifficulty("daily");
    setCurrentChallengeNumber(dailyChallenge.challenge_number);
    setDailyChallengeWord(dailyChallenge.word);
    setDailyChallengeOriginalDifficulty(dailyChallenge.difficulty);

    setGameMechanics({
      hidden: dailyChallenge.has_hidden_letter,
      fake: dailyChallenge.has_fake_letter,
      dark: dailyChallenge.has_dark_mode,
      still: dailyChallenge.has_still_mode,
      first: dailyChallenge.has_first_letter,
    });

    setGameTime(dailyChallenge.time_seconds);
    setDailyChallengeInitialTime(dailyChallenge.time_seconds);

    setLevel(1);
    setTotalPoints(0);
    setNumberOfPerfectRounds(0);
    setNumberOfRounds(0);
    setPreviousRoundsWords([]);

    setMode("loading");
  };

  return {
    dailyChallenge,
    loading,
    error,
    alreadyPlayed,
    loadDailyChallenge,
    startDailyChallenge,
  };
}
