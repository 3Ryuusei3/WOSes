import { useState, useEffect } from 'react';

import Tooltip from './Tooltip';

import useGameStore from '../store/useGameStore';

import TopScore from '../types/TopScore';

import sql from '../utils/db';

interface TopScoresProps {
  hasTooltip?: boolean;
}

export default function TopScores({ hasTooltip = false }: TopScoresProps) {
  const [topScores, setTopScores] = useState<TopScore[]>([]);
  const { highestScore } = useGameStore();

  useEffect(() => {
    async function fetchTopScores() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any[] = await sql`SELECT * FROM scores ORDER BY level DESC, score DESC LIMIT 8`;
        const ddbbTopScores: TopScore[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          score: item.score,
          level: item.level,
          created_at: item.created_at,
        }));
        setTopScores(ddbbTopScores);
      } catch (error) {
        console.error('Error fetching top scores:', error);
      }
    }

    fetchTopScores();
  }, [highestScore]);

  return (
    <>
      <div className="ranking__container">
        {hasTooltip && (
          <Tooltip message="El ranking puede tardar en actualizarse">
            <div className='info-icon'>𝑖</div>
          </Tooltip>
        )}
        {topScores.length === 0 ? <p>CARGANDO...</p> : (
          <table className="ranking__entry">
            <tbody>
              {topScores.map((entry, index) => (
                <tr key={entry.id}>
                  <td>
                    <span className={
                    `${index === 0 ? 'won'
                      : index === 1 ? 'highlight'
                      : index === 2 ? 'unguessed' : 'lost'}`}>
                        {index + 1}
                    </span></td>
                  <td>{entry.name}</td>
                  <td>{entry.score}</td>
                  <td>LV{entry.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
