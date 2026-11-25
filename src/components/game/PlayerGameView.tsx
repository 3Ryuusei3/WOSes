import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import reloadIcon from "../../assets/reload.svg";
import { submitWord } from "../../services/multiplayer";
import Word from "../../types/Word";
import Difficulty from "../../types/Difficulty";
import Mechanics from "../../types/Mechanics";

const NO_MECHANICS: Mechanics = {
  fake: false,
  hidden: false,
  first: false,
  dark: false,
  still: false,
  mirrored: false,
};
import GameHud from "../../atoms/GameHud";
import WarningMessage from "../../atoms/WarningMessage";
import SelectedWord from "../../atoms/SelectedWord";
import KeyboardReserve from "../../atoms/KeyboardReserve";
import GameSound from "../../atoms/GameSound";
import FullscreenButton from "../../atoms/FullscreenButton";
import useMobileLayout from "../../hooks/useMobileLayout";
import WordList from "../../atoms/WordList";
import useMobileUserAgent from "../../hooks/useMobileUserAgent";
import { focusInputWithoutScroll } from "../../utils/mobileKeyboard";
import useGameStore from "../../store/useGameStore";
import {
  useRoomRealtimeStore,
  type RtBoard,
} from "../../realtime/roomRealtime";
import { RUNNING_OUT_OF_TIME_PERCENTAGE } from "../../constant";

const SHOW_BOARD_KEY = "wos:player-show-board";

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
  timeLeft: number;
  startedAt: number;
  durationMs: number;
  correctWordsPoints: () => number;
  goalPoints: number;
  /** Host playing too: its own letters (it doesn't receive its broadcast) */
  localBoard?: RtBoard | null;
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
  timeLeft,
  startedAt,
  durationMs,
  correctWordsPoints,
  goalPoints,
  localBoard,
}: PlayerGameViewProps) {
  const { t } = useTranslation();
  const isMobile = useMobileUserAgent();
  // Mobile layout: "back" next to the level box (top row); desktop: the
  // panel's top-left corner
  const isMobileLayout = useMobileLayout();
  // Letras exactamente como las ve el host (llegan por Realtime)
  const rtBoard = useRoomRealtimeStore((s) => s.board);
  const board = localBoard !== undefined ? localBoard : rtBoard;
  const storeLevel = useGameStore((s) => s.level);
  const myName = useGameStore((s) => s.playerName);
  // Word list (with who guessed each word), can be hidden; the letters and
  // the timer are always shown. Remembered on this device for next games.
  const [showBoard, setShowBoard] = useState(
    () => localStorage.getItem(SHOW_BOARD_KEY) !== "0",
  );
  // Room without main screen: everyone always sees the board (no toggle)
  const boardLocked = localBoard !== undefined || board?.host_plays === true;
  const boardVisible = boardLocked || showBoard;
  const toggleBoard = () => {
    setShowBoard((prev) => {
      localStorage.setItem(SHOW_BOARD_KEY, prev ? "0" : "1");
      return !prev;
    });
  };
  const storeDifficulty = useGameStore((s) => s.gameDifficulty);
  const [playerAttempts, setPlayerAttempts] = useState<PlayerAttempt[]>([]);
  const inputWordRef = useRef(inputWord);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mobile: take the focus at the start (Android opens the keyboard; on iOS
  // the round isn't started by this player's tap, so they tap the input)
  useEffect(() => {
    if (isMobile) inputRef.current?.focus({ preventScroll: true });
  }, [isMobile]);

  useEffect(() => {
    inputWordRef.current = inputWord;
  }, [inputWord]);

  const submitCurrentWord = useCallback(
    async (snapshot?: string) => {
      const raw = (snapshot ?? inputWordRef.current).trim();
      if (raw === "") return;
      const attempt = raw.toLowerCase();
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
              it.word === localWord ? { ...it, status: "correct" } : it,
            ),
          );
          markWordGuessed(localWord);
        } else {
          setPlayerAttempts((prev) =>
            prev.map((it) =>
              it.word === localWord ? { ...it, status: "rejected" } : it,
            ),
          );
        }
      }
    },
    [clearInput, markWordGuessed, playerId, possibleWords, roomCode, words],
  );

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const snap = (e.currentTarget as HTMLInputElement).value;
      await submitCurrentWord(snap);
    }
  };

  return (
    <>
      <GameHud
        words={words}
        correctWordsPoints={correctWordsPoints}
        goalPoints={goalPoints}
        level={board?.level ?? storeLevel}
        gameDifficulty={(board?.difficulty as Difficulty) ?? storeDifficulty}
        dailyChallengeOriginalDifficulty={
          (board?.daily_original_difficulty as Difficulty | null) ?? null
        }
        timeLeft={timeLeft}
        startedAt={startedAt}
        durationMs={durationMs}
        percentage={percentage}
        RUNNING_OUT_OF_TIME_PERCENTAGE={RUNNING_OUT_OF_TIME_PERCENTAGE}
        SHOW_LETTERS_PERCENTAGE={board?.show_letters_percentage ?? 0}
        trailing={
          !isMobileLayout ? (
            <>
              <FullscreenButton className="volume-control--hud" />
              <GameSound className="volume-control--hud" />
            </>
          ) : undefined
        }
      />
      <div
        className="game__container game__container--player"
        // Mobile: tapping the board must not close the device keyboard
        onMouseDown={
          isMobile
            ? (e) => {
                if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
              }
            : undefined
        }
      >
        {/* Host that plays, on a phone: sound in the board's corner */}
        {isMobileLayout && <GameSound className="volume-control--panel" />}
        <div className="game__header">
          <div className="v-section">
            {board ? (
              <>
                <WarningMessage gameMechanics={board.mechanics} />
                <SelectedWord
                  shuffledWordObject={board.letters}
                  percentage={percentage}
                  gameMechanics={board.mechanics}
                  SHOW_LETTERS_PERCENTAGE={board.show_letters_percentage}
                />
              </>
            ) : (
              <p className="txt-center">{t("game.waitingForHost")}</p>
            )}
          </div>
        </div>
        {boardVisible && (
          <WordList
            words={words}
            playerName={myName}
            percentage={percentage}
            gameMechanics={board?.mechanics ?? NO_MECHANICS}
            SHOW_LETTERS_PERCENTAGE={board?.show_letters_percentage ?? 0}
          />
        )}
        <div className="h-section gap-xs player-actions">
          <button className="btn btn--deco btn--xs">
            {t("common.points")} {playerRoundPoints}
          </button>
          {!boardLocked && (
            <button
              type="button"
              className="btn btn--xs"
              onClick={toggleBoard}
              aria-pressed={showBoard}
            >
              {showBoard ? t("game.hideBoard") : t("game.showBoard")}
            </button>
          )}
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
              <img src={reloadIcon} alt="reload" className="player-selector" />
            </button>
          )}
        </div>
        {/* With the board visible, only the last attempt as feedback */}
        <div
          className={`attemptList ${boardVisible ? "attemptList--last" : ""}`}
        >
          {(boardVisible ? playerAttempts.slice(0, 1) : playerAttempts).map(
            (it, idx) => (
              <h4
                key={`${idx}-${it.word}`}
                className={`attempt attempt--${it.status} ${it.status === "correct" ? "highlight" : it.status === "tip" ? "tip" : "dark"} txt-center`}
              >
                {it.word.toUpperCase()}
              </h4>
            ),
          )}
        </div>
        {/* Right above the device keyboard */}
        <input
          ref={inputRef}
          type="text"
          className="mx-auto"
          placeholder={t("game.inputWord")}
          value={inputWord}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={percentage === 0}
          autoFocus={!isMobile}
          // Mobile: re-focusing after the keyboard was closed must not
          // shift the page
          onTouchEnd={isMobile ? focusInputWithoutScroll : undefined}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
      {isMobile && (
        <KeyboardReserve
          onActivate={() => inputRef.current?.focus({ preventScroll: true })}
        />
      )}
    </>
  );
}
