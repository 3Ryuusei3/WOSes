import { useState, useEffect } from 'react';

import Tooltip from './Tooltip';

import useGameStore from '../store/useGameStore';

import TopScore from '../types/TopScore';

import sql from '../utils/db';

import arrowLeft from '../assets/arrow-left.svg';
import arrowRight from '../assets/arrow-right.svg';

interface TopScoresProps {
  hasTooltip?: boolean;
}

export default function TopScores({ hasTooltip = false }: TopScoresProps) {
  const [allTimeScores, setAllTimeScores] = useState<TopScore[]>([]);
  const [todayScores, setTodayScores] = useState<TopScore[]>([]);
  const { highestScore } = useGameStore();
  const [showAllTime, setShowAllTime] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      try {
        const allTimeData = await sql`
          SELECT * FROM scores
          ORDER BY level DESC, score ASC
          LIMIT 10
        ` as { id: string; name: string; score: number; level: number; created_at: string }[];

        const todayData = await sql`
          SELECT * FROM scores
          WHERE DATE(created_at) = CURRENT_DATE
          ORDER BY level DESC, score ASC
          LIMIT 10
        ` as { id: string; name: string; score: number; level: number; created_at: string }[];

        const mapScores = (data: { id: string; name: string; score: number; level: number; created_at: string }[]): TopScore[] => data.map((item) => ({
          id: item.id,
          name: item.name,
          score: item.score,
          level: item.level,
          created_at: item.created_at,
        }));

        setAllTimeScores(mapScores(allTimeData));
        setTodayScores(mapScores(todayData));
      } catch (error) {
        console.error('Error fetching scores:', error);
      }
    }

    fetchScores();
  }, [highestScore]);

  const toggleRanking = () => {
    setShowAllTime((prev) => !prev);
  };

  const currentScores = showAllTime ? allTimeScores : todayScores;

  return (
    <div className={`v-section ${hasTooltip ? 'gap-xs' : 'gap-md'}`}>
      <div className={`top-scores__arrows ${hasTooltip ? 'top-scores__arrows--tooltip' : ''}`}>
        <img src={arrowLeft} alt="arrow-left" onClick={toggleRanking} />
        <img src={arrowRight} alt="arrow-right" onClick={toggleRanking} />
      </div>
      {hasTooltip ? (
        <p>{showAllTime ? "TOP 10 TOTAL" : "TOP 10 HOY"}</p>
      ) : (
      <h2>{showAllTime ? "TOP 10 TOTAL" : "TOP 10 HOY"}</h2>
      )}
      <div className="ranking">
        {hasTooltip && (
          <Tooltip message="El ranking puede tardar en actualizarse">
            <div className='info-icon'>𝑖</div>
          </Tooltip>
        )}
        <div>
          <table className="ranking__table">
            <tbody>
              {Array.from({ length: 10 }, (_, index) => {
                const entry = currentScores[index] || { name: '', score: 0, level: 0 };
                return (
                  <tr key={index}>
                    <td>
                      <span className={
                        `${index === 0 ? 'won'
                          : index === 1 ? 'highlight'
                          : index === 2 ? 'unguessed' : 'lost'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td>{entry.name || '---------------'}</td>
                    <td>{entry.score || '----' }</td>
                    <td>{entry.level ? `LV${String(entry.level).padStart(2, '0')}` : '-----'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
