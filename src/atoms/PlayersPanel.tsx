import PlayersRanking from './PlayersRanking';

import useGameStore from '../store/useGameStore';
import Word from '../types/Word';
import useWindowSize from '../hooks/useWindowSize';
import DifficultyTag from './DifficultyTag';
import { useTranslation } from 'react-i18next';

interface PlayersPanelProps {
  lastLevelWords: Word[];
}

export default function PlayersPanel({ lastLevelWords }: PlayersPanelProps) {
  const { t } = useTranslation();
  const { playerName, gameDifficulty, level } = useGameStore();
  const { columns } = useWindowSize();

  return (
    <div className="v-section gap-md">
      <div className="h-section gap-xs f-jc-c">
        <div>
          <DifficultyTag gameDifficulty={gameDifficulty} />
        </div>
        <button className="btn btn--deco btn--xs">{t('common.level')} {level}</button>
        <button className="btn btn--deco btn--xs">{playerName}</button>
      </div>
      <div className="v-section score__container--box dark player-list pos-rel">
        <PlayersRanking toggleable />
      </div>
      <div className="v-section score__container--box">
        <p>{t('common.lastWords')}</p>
        <div className="v-section score__container--wordlist" style={{ '--wordlist-rows': Math.ceil(lastLevelWords.length / columns), '--wordlist-columns': columns } as React.CSSProperties}>
          {lastLevelWords.map((w, idx) => {
            const isMine = w.guessed && (w as any).guessedByName && (w as any).guessedByName === playerName;
            const cls = isMine ? 'won' : (w.guessed ? 'highlight' : 'unguessed');
            return (
              <h6 key={`${idx}-${w.word}`} className={cls}>{w.word.toUpperCase()}</h6>
            );
          })}
        </div>
      </div>
    </div>
  );
}
