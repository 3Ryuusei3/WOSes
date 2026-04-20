import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from "react-router-dom";

import HomePage from "./components/HomePage";
import GamePage from "./components/GamePage";
import useZoom, {
  ZoomProvider,
  computeEffectiveGameZoom,
} from "./hooks/useZoom";
import useGameStore from "./store/useGameStore";
import { isMobileUserAgent } from "./utils/mobileUserAgent";

function BodyLayoutClassSync() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const role = useGameStore((s) => s.role);
  const zoom = useZoom();
  const roomId = searchParams.get("id");
  const hasRoomIdInUrl = !!roomId;
  const effectiveZoom = computeEffectiveGameZoom(zoom, role, hasRoomIdInUrl);
  const isZoomed = effectiveZoom !== 1;

  useEffect(() => {
    document.body.classList.remove("mobile", "is-zoomed");

    if (isMobileUserAgent()) {
      document.body.classList.add("mobile");
    } else if (pathname === "/game") {
      document.body.classList.add(isZoomed ? "is-zoomed" : "mob");
    }

    return () => {
      document.body.classList.remove("mobile", "is-zoomed");
    };
  }, [pathname, isZoomed]);

  return null;
}

function App() {
  return (
    <ZoomProvider>
      <Router>
        <BodyLayoutClassSync />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </ZoomProvider>
  );
}

export default App;
