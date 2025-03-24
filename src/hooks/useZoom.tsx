import { useState, useEffect } from 'react';

const REFERENCE_WIDTH = 1350;
const REFERENCE_HEIGHT = 850;

function useZoom() {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const widthZoom = width / REFERENCE_WIDTH;
      const heightZoom = height / REFERENCE_HEIGHT;

      const calculatedZoom = Math.min(widthZoom, heightZoom);
      setZoom(calculatedZoom);
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
