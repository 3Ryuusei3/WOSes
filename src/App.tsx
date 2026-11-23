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
import { shouldUseFluidScale } from "./hooks/fluidScale";
import useGameStore from "./store/useGameStore";
import { isMobileUserAgent } from "./utils/mobileUserAgent";

function BodyLayoutClassSync() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const role = useGameStore((s) => s.role);
  const hasRoomIdInUrl = !!searchParams.get("id");
  const isScaled = shouldUseFluidScale(role, hasRoomIdInUrl);

  useEffect(() => {
    // On <html> so the classes can set the root font-size (rem scaling).
    const html = document.documentElement;

    if (isMobileUserAgent()) {
      html.classList.add("mobile");
    } else if (pathname === "/game" && isScaled) {
      html.classList.add("fluid-scale");
    }

    return () => {
      html.classList.remove("mobile", "fluid-scale");
    };
  }, [pathname, isScaled]);

  return null;
}

function App() {
  return (
    <Router>
      <BodyLayoutClassSync />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
