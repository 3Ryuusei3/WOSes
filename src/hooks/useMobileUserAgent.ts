import { useState } from "react";

import { isMobileUserAgent } from "../utils/mobileUserAgent";

export default function useMobileUserAgent() {
  const [isMobile] = useState(
    () => typeof navigator !== "undefined" && isMobileUserAgent(),
  );
  return isMobile;
}
