import { useState } from "react";
import { useTranslation } from "react-i18next";
import reloadIcon from "../../assets/reload.svg";
import { submitWord } from "../../services/multiplayer";
import Word from "../../types/Word";

interface PlayerAttempt {
  word: string;
  status: "pending" | "correct" | "invalid" | "rejected" | "tip";
}

interface PlayerGameViewProps {
  playerRoundPoints: number;
  showReconnectButton: boolean;
  connectionStatus: string;
  syncNow: () => void;
  isSyncing: boolean;
  inputWord: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearInput: () => void;
  possibleWords: string[];
  words: Word[];
  playerId: number | null;
  roomCode: string;
  markWordGuessed: (word: string) => void;
  percentage: number;
}

export default function PlayerGameView({
  playerRoundPoints,
  showReconnectButton,
  connectionStatus,
  syncNow,
  isSyncing,
  inputWord,
  handleChange,
  clearInput,
  possibleWords,
  words,
  playerId,
  roomCode,
  markWordGuessed,
  percentage,
}: PlayerGameViewProps) {
  const { t } = useTranslation();
  const [playerAttempts, setPlayerAttempts] = useState<PlayerAttempt[]>([]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputWord.trim() !== "") {
      const attempt = inputWord.trim().toLowerCase();
      if (attempt.length < 4) {
        clearInput();
        return;
      }
      const isValid = possibleWords.includes(attempt);
      const localWord = attempt;
      clearInput();
      const alreadySolvedGlobally = words.some(
        (w) => w.word === localWord && w.guessed,
      );
      if (alreadySolvedGlobally) {
        setPlayerAttempts((prev) => [
          { word: localWord, status: "tip" as any },
          ...prev,
        ]);
        return;
      }

      if (!isValid) {
        setPlayerAttempts((prev) => [
          { word: localWord, status: "invalid" },
          ...prev,
        ]);
      } else if (isValid && playerId && roomCode) {
        setPlayerAttempts((prev) => [
          { word: localWord, status: "pending" },
          ...prev,
        ]);
        const { data, error } = await submitWord(
          roomCode,
          playerId,
          localWord,
          true,
        );
        if (!error && data && (data as any).status === "correct") {
          setPlayerAttempts((prev) =>
            prev.map((it) =>
              it.word === localWord
                ? { ...it, status: "correct" }
                : it,
            ),
          );
          markWordGuessed(localWord);
        } else {
          setPlayerAttempts((prev) =>
            prev.map((it) =>
              it.word === localWord
                ? { ...it, status: "rejected" }
                : it,
            ),
          );
        }
      }
    }
  };

  return (
    <div className="game__container">
      <div className="h-section gap-xs">
        <button className="btn btn--deco btn--xs">
          {t("common.points")} {playerRoundPoints}
        </button>
        {showReconnectButton && (
          <button
            className={`btn btn--xs ml-auto ${connectionStatus !== "connected" ? "btn--lose" : ""}`}
            onClick={syncNow}
            disabled={isSyncing}
            title={
              connectionStatus !== "connected"
                ? t("game.reconnect")
                : t("common.updateState")
            }
          >
            <span className="sr-only">{t("game.reconnect")}</span>
            <img
              src={reloadIcon}
              alt="reload"
              className="player-selector"
            />
          </button>
        )}
      </div>
      <div className="v-section gap-sm w100 f-jc-c">
        <input
          type="text"
          className="mx-auto mt-auto"
          placeholder={t("game.inputWord")}
          value={inputWord}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={percentage === 0}
        />
        <div className="attemptList">
          {playerAttempts.map((it, idx) => (
            <h4
              key={`${idx}-${it.word}`}
              className={`${it.status === "correct" ? "highlight" : it.status === "tip" ? "tip" : "dark"} txt-center`}
            >
              {it.word.toUpperCase()}
            </h4>
          ))}
        </div>
      </div>
    </div>
  );
}
