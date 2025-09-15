import PlayersRanking from './PlayersRanking';

import useGameStore from '../store/useGameStore';
import Word from '../types/Word';
import { useTranslation } from 'react-i18next';

interface PlayersPanelProps {
  lastLevelWords: Word[];
}

export default function PlayersPanel({ lastLevelWords }: PlayersPanelProps) {
  const { t } = useTranslation();
  const { playerName } = useGameStore();

  return (
    <div className="v-section gap-md">
      <div className="v-section score__container--box dark player-list pos-rel">
        <PlayersRanking toggleable />
      </div>
      <div className="v-section score__container--box">
        <p>{t('common.lastWords')}</p>
        <div className="v-section score__container--wordlist" style={{ '--wordlist-rows': Math.ceil(lastLevelWords.length / 3), '--wordlist-columns': 3 } as React.CSSProperties}>
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
