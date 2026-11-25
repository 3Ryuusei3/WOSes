import { useRef } from "react";

import ScoreContainer from "../../atoms/ScoreContainer";
import WordInput, { type WordInputHandle } from "../../atoms/WordInput";
import KeyboardReserve from "../../atoms/KeyboardReserve";
import useMobileUserAgent from "../../hooks/useMobileUserAgent";
import WarningMessage from "../../atoms/WarningMessage";
import WordList from "../../atoms/WordList";
import ProgressBar from "../../atoms/ProgressBar";
import SelectedWord from "../../atoms/SelectedWord";
import GameSound from "../../atoms/GameSound";
import BackHomeButton from "../../atoms/BackHomeButton";
import useMobileLayout from "../../hooks/useMobileLayout";
import Word from "../../types/Word";
import Difficulty from "../../types/Difficulty";
import { RUNNING_OUT_OF_TIME_PERCENTAGE } from "../../constant";

interface HostGameViewProps {
  words: Word[];
  correctWordsPoints: () => number;
  goalPoints: number;
  level: number;
  gameDifficulty: Difficulty;
  dailyChallengeOriginalDifficulty: Difficulty | null;
  gameMechanics: {
    fake: boolean;
    hidden: boolean;
    first: boolean;
    dark: boolean;
    still: boolean;
    mirrored: boolean;
  };
  shuffledWordObject: any;
  percentage: number;
  showLettersPercentage: number;
  timeLeft: number;
  startedAt: number;
  durationMs: number;
  playerName: string;
  players: "single" | "multi";
  inputWord: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  possibleWords: string[];
  correctWords: string[];
  volume: number;
}

export default function HostGameView({
  words,
  correctWordsPoints,
  goalPoints,
  level,
  gameDifficulty,
  dailyChallengeOriginalDifficulty,
  gameMechanics,
  shuffledWordObject,
  percentage,
  showLettersPercentage,
  timeLeft,
  startedAt,
  durationMs,
  playerName,
  players,
  inputWord,
  handleChange,
  handleKeyDown,
  possibleWords,
  correctWords,
  volume,
}: HostGameViewProps) {
  const wordInputRef = useRef<WordInputHandle>(null);
  const isMobile = useMobileUserAgent();
  // Mobile layout: "back" goes next to the level box (top row); desktop:
  // the panel's top-left corner
  const isMobileLayout = useMobileLayout();

  return (
    <>
      <ScoreContainer
        words={words}
        correctWordsPoints={correctWordsPoints}
        goalPoints={goalPoints}
        level={level}
        gameDifficulty={gameDifficulty}
        dailyChallengeOriginalDifficulty={dailyChallengeOriginalDifficulty}
        showBackHome={isMobileLayout}
      />
      <div
        className="game__container"
        // Mobile: tapping the board must not close the device keyboard
        onMouseDown={
          isMobile
            ? (e) => {
                if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
              }
            : undefined
        }
      >
        <div className="game__header">
          <div className="v-section">
            <WarningMessage gameMechanics={gameMechanics} />
            <SelectedWord
              shuffledWordObject={shuffledWordObject}
              percentage={percentage}
              gameMechanics={gameMechanics}
              SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
            />
          </div>
          <ProgressBar
            // Phones: the top corners hold the score boxes, so the sound
            // button goes at the left of the seconds row
            leading={
              isMobileLayout ? (
                <GameSound className="volume-control--inline" />
              ) : undefined
            }
            timeLeft={timeLeft}
            startedAt={startedAt}
            durationMs={durationMs}
            percentage={percentage}
            RUNNING_OUT_OF_TIME_PERCENTAGE={RUNNING_OUT_OF_TIME_PERCENTAGE}
            SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
          />
        </div>
        <WordList
          words={words}
          playerName={playerName}
          percentage={percentage}
          gameMechanics={gameMechanics}
          SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
        />
        {!isMobileLayout && <BackHomeButton className="back-control--panel" />}
        {players === "single" && (
          <WordInput
            ref={wordInputRef}
            inputWord={inputWord}
            handleChange={handleChange}
            handleKeyDown={handleKeyDown}
            possibleWords={possibleWords}
            correctWords={correctWords}
            percentage={percentage}
            volume={volume}
          />
        )}
        {!isMobileLayout && <GameSound />}
      </div>
      {isMobile && players === "single" && (
        <KeyboardReserve onActivate={() => wordInputRef.current?.focus()} />
      )}
    </>
  );
}
