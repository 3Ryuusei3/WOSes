import { useState, useEffect } from 'react';
import sql from '../utils/db';

interface Highscore {
  id: string;
  name: string;
  score: number;
  level: number;
  created_at: string | null;
}

export default function Highscores() {
  const [highscores, setHighscores] = useState<Highscore[]>([]);

  useEffect(() => {
    async function fetchHighscores() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any[] = await sql`SELECT * FROM scores ORDER BY level DESC, score DESC LIMIT 5`;
        const highscores: Highscore[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          score: item.score,
          level: item.level,
          created_at: item.created_at,
        }));
        setHighscores(highscores);
      } catch (error) {
        console.error('Error fetching highscores:', error);
      }
    }

    fetchHighscores();
  }, []);

  return (
    <>
      <div className="ranking__container">
        {highscores.length === 0 ? <p>CARGANDO...</p> : (
          <table className="ranking__entry">
            <tbody>
              {highscores.map((entry, index) => (
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
