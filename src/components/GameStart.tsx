import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import TopScores from '../atoms/TopScores';
import HowToPlayModal from '../atoms/HowToPlayModal';
import DifficultySelector from '../atoms/DifficultySelector';
import LanguageSelector from '../atoms/LanguageSelector';

import useRandomWords from '../hooks/useRandomWords';
import useBackgroundAudio from '../hooks/useBackgroundAudio';
import useSetMechanics from '../hooks/useSetMechanics';

import useGameStore from '../store/useGameStore';
import GameSound from '../atoms/GameSound';
import PlayersSelector from '../atoms/PlayersSelector';

import { generateRandomRoomCode, isValidPlayerName } from '../utils';
import { createRoomWithHost } from '../services/multiplayer';

export default function GameStart() {
  const { playerName, setPlayerName, setMode, gameMechanics, level, setGameDifficulty, gameDifficulty, volume, players, setPlayers, setRoomCode, setRole, setRoomId } = useGameStore();
  const [error, setError] = useState(false);
  const [howToPlayModal, setHowToPlayModal] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enableMulti = searchParams.get('multi') === 'true';

  useSetMechanics(gameMechanics, level);
  useRandomWords(gameDifficulty);

  useBackgroundAudio(volume);

  const handleSubmit = async () => {
    if (isValidPlayerName(playerName)) {
      if (!enableMulti) {
        // Force singleplayer if multi not enabled via query
        setPlayers('single');
      }
      if (players === 'single') {
        setMode('loading');
      } else {
        const roomCode = generateRandomRoomCode();
        setRoomCode(roomCode);
        const { data, error } = await createRoomWithHost(roomCode, playerName, gameDifficulty);
        if (!error && data) {
          setRole('host');
          setRoomId(data.room.id);
          navigate(`/game?id=${roomCode}`);
        } else {
          setError(true);
        }
      }
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

  const getButtonText = () => {
    const difficultyLabel = t(`difficulties.${gameDifficulty}`);
    if (players === 'multi') {
      return t('common.startMultiplayer', { difficulty: difficultyLabel });
    } else {
      return t('common.start', { difficulty: difficultyLabel });
    }
  };

  return (
    <>
      <div className='game__container f-jc-c pos-rel'>
        <LanguageSelector />
        <div className="h-section gap-sm">
          <div className='v-section gap-md w100 f-jc-c'>
            <h2 className='highlight'>{t('gameStart.nameAndDifficulty')}</h2>
            <DifficultySelector
              gameDifficulty={gameDifficulty}
              onDifficultyChange={setGameDifficulty}
            />
            <PlayersSelector
              players={players}
              setPlayers={setPlayers}
              enableMulti={enableMulti}
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
              >
                {getButtonText()}
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
