import { useState, useEffect } from 'react';

function useZoom() {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1350) {
        setZoom(1);
      } else {
        setZoom(width / 1350);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return zoom;
}

export default useZoom;
