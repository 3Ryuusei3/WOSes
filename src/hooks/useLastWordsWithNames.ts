import { useMemo } from "react";

import Word from "../types/Word";
import {
  selectCurrentRoundWords,
  useRoomRealtimeStore,
} from "../realtime/roomRealtime";

/**
 * Multiplayer: adds who guessed each word of the last level, from the
 * server's correct words of that round (the host's own list doesn't carry
 * names), so every device colours "my words" the same way.
 */
export default function useLastWordsWithNames(
  lastLevelWords: Word[],
  enabled: boolean,
): Word[] {
  const roundWords = useRoomRealtimeStore(selectCurrentRoundWords);

  return useMemo(() => {
    if (!enabled || roundWords.length === 0) return lastLevelWords;
    const byWord = new Map(
      roundWords.map((w) => [w.word.toLowerCase(), w.player_name]),
    );
    return lastLevelWords.map((w) =>
      w.guessedByName
        ? w
        : { ...w, guessedByName: byWord.get(w.word.toLowerCase()) },
    );
  }, [lastLevelWords, roundWords, enabled]);
}
