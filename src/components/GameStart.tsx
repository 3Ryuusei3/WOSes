import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import TopScores from '../atoms/TopScores';
import HowToPlayModal from '../atoms/HowToPlayModal';
import DifficultySelector from '../atoms/DifficultySelector';
import LanguageSelector from '../atoms/LanguageSelector';
import Difficulty from '../types/Difficulty';

import useRandomWords from '../hooks/useRandomWords';
import useBackgroundAudio from '../hooks/useBackgroundAudio';
import useSetMechanics from '../hooks/useSetMechanics';

import useGameStore from '../store/useGameStore';
import GameSound from '../atoms/GameSound';

export default function GameStart() {
  const { playerName, setPlayerName, setMode, gameMechanics, level, setGameDifficulty, gameDifficulty, volume } = useGameStore();
  const [error, setError] = useState(false);
  const [howToPlayModal, setHowToPlayModal] = useState(false);
  const { t } = useTranslation();

  useSetMechanics(gameMechanics, level);
  useRandomWords(gameDifficulty);

  useBackgroundAudio(volume);

  const handleSubmit = () => {
    if (playerName.length >= 3 && playerName.length <= 10) {
      setMode('loading');
    } else {
      setError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setError(false);
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setPlayerName(value);
  };

  const getDifficultyLabel = (difficulty: Difficulty) => {
    return t(`difficulties.${difficulty}`);
  };

  return (
    <>
      <div className='game__container f-jc-c pos-rel'>
        <LanguageSelector />
        <div className="h-section gap-sm">
          <div className='v-section gap-md w100 f-jc-c'>
            <h2 className='highlight title-sm'>{t('gameStart.nameAndDifficulty')}</h2>
            <DifficultySelector
              gameDifficulty={gameDifficulty}
              onDifficultyChange={setGameDifficulty}
            />
            <div className="v-section gap-xs">
              <input
                className='mx-auto'
                type='text'
                placeholder={t('common.enterName')}
                value={playerName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
              <small className={`txt-center ${error ? '' : 'op-0'}`}>
                {t('gameStart.nameError')}
              </small>
            </div>
            <h6 className='highlight cursor' onClick={() => setHowToPlayModal(true)}><u>{t('gameStart.learnToPlay')}</u></h6>
            <div className="h-section gap-xs f-jc-c">
              <button
                className={`btn ${gameDifficulty === 'easy' ? 'btn--win' : gameDifficulty === 'hard' ? 'btn--lose' : ''}`}
                onClick={handleSubmit}
                data-start-button="true"
              >
                {t('common.start', { difficulty: getDifficultyLabel(gameDifficulty) })}
              </button>
            </div>
          </div>
          <div className="ranking ranking--lg v-section gap-md top-scores">
            <div className="score__container--box dark">
              <TopScores difficulty={gameDifficulty} />
            </div>
          </div>
        </div>
        <GameSound />
      </div>
      <HowToPlayModal isOpen={howToPlayModal} setHowToPlayModal={setHowToPlayModal} />
    </>
  );
}
