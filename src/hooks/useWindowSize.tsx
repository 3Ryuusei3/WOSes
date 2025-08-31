import { useEffect, useState } from 'react';

export default function useWindowSize() {
  const [columns, setColumns] = useState<number>(3);

  useEffect(() => {
    const updateColumns = () => {
      setColumns(window.innerWidth < 576 ? 2 : 3);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);

    return () => {
      window.removeEventListener('resize', updateColumns);
    };
  }, []);

  return { columns };
}
