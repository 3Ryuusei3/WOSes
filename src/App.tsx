import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import GamePage from "./components/GamePage";
import { shouldUseFluidScale } from "./hooks/fluidScale";
import useMobileLayout from "./hooks/useMobileLayout";

function BodyLayoutClassSync() {
  const isScaled = shouldUseFluidScale();
  // Phones and narrow windows; updates when the window is resized
  const isMobile = useMobileLayout();

  useEffect(() => {
    // On <html> so the classes can set the root font-size (rem scaling).
    const html = document.documentElement;

    if (isMobile) {
      html.classList.add("mobile");
    } else if (isScaled) {
      html.classList.add("fluid-scale");
    }

    return () => {
      html.classList.remove("mobile", "fluid-scale");
    };
  }, [isScaled, isMobile]);

  return null;
}

function App() {
  return (
    <Router>
      <BodyLayoutClassSync />
      <Routes>
        {/* One route for the whole game ("/" = start screen, "/game" while
            playing): changing the address doesn't remount the game */}
        <Route path="*" element={<GamePage />} />
      </Routes>
    </Router>
  );
}

export default App;
