import ScoreContainer from "../../atoms/ScoreContainer";
import WordInput from "../../atoms/WordInput";
import WarningMessage from "../../atoms/WarningMessage";
import WordList from "../../atoms/WordList";
import ProgressBar from "../../atoms/ProgressBar";
import SelectedWord from "../../atoms/SelectedWord";
import GameSound from "../../atoms/GameSound";
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
  };
  shuffledWordObject: any;
  percentage: number;
  showLettersPercentage: number;
  timeLeft: number;
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
  playerName,
  players,
  inputWord,
  handleChange,
  handleKeyDown,
  possibleWords,
  correctWords,
  volume,
}: HostGameViewProps) {
  return (
    <>
      <ScoreContainer
        words={words}
        correctWordsPoints={correctWordsPoints}
        goalPoints={goalPoints}
        level={level}
        gameDifficulty={gameDifficulty}
        dailyChallengeOriginalDifficulty={dailyChallengeOriginalDifficulty}
      />
      <div className="game__container">
        <div className="v-section gap-xs">
          <div className="v-section gap-sm">
            <WarningMessage gameMechanics={gameMechanics} />
            <SelectedWord
              shuffledWordObject={shuffledWordObject}
              percentage={percentage}
              gameMechanics={gameMechanics}
              SHOW_LETTERS_PERCENTAGE={showLettersPercentage}
            />
          </div>
          <ProgressBar
            timeLeft={timeLeft}
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
        {players === "single" && (
          <WordInput
            inputWord={inputWord}
            handleChange={handleChange}
            handleKeyDown={handleKeyDown}
            possibleWords={possibleWords}
            correctWords={correctWords}
            percentage={percentage}
            volume={volume}
          />
        )}
        <GameSound />
      </div>
    </>
  );
}
