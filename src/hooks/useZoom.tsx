import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import type Role from '../types/Role';
import { isMobileUserAgent } from '../utils/mobileUserAgent';

const REFERENCE_WIDTH = 1350;
const REFERENCE_HEIGHT = 850;

const ZoomContext = createContext<number | null>(null);

function useViewportZoomValue() {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (isMobileUserAgent()) {
      return;
    }

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

/** Single viewport zoom source for layout + body class sync. */
export function ZoomProvider({ children }: { children: ReactNode }) {
  const zoom = useViewportZoomValue();
  return <ZoomContext.Provider value={zoom}>{children}</ZoomContext.Provider>;
}

function useZoom() {
  const zoom = useContext(ZoomContext);
  if (zoom === null) {
    throw new Error('useZoom must be used within ZoomProvider');
  }
  return zoom;
}

/** Zoom shown in the game shell (host vs player / join link edge cases). */
export function computeEffectiveGameZoom(
  zoom: number,
  role: Role | null,
  hasRoomIdInUrl: boolean,
): number {
  if (role === 'player') return 1;
  if (role === null && hasRoomIdInUrl) return 1;
  return zoom;
}

export default useZoom;
