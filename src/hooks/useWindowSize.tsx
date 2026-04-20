import { useEffect, useState } from 'react';

export default function useWindowSize() {
  const [columns, setColumns] = useState<number>(3);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const updateSize = () => {
      setColumns(window.innerWidth < 576 ? 2 : 3);
      setIsMobile(window.innerWidth < 768);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return { columns, isMobile };
}


