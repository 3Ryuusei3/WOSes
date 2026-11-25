interface GameLogoProps {
  /** Logo width (in px at the 16px base) when the large variant is shown. */
  width?: number;
  large?: boolean;
}

/**
 * LEXIO wordmark: cream letters with a dark outline and the X as a tilted
 * yellow sticker. Pure text (no image), so it scales with the root font-size.
 */
export default function GameLogo({ width = 230, large = false }: GameLogoProps) {
  // The wordmark is ~3.4 times as wide as its font size
  const fontRem = (large ? width : 80) / 16 / 3.4;
  return (
    <div className="logo-container">
      <h1
        className="logo lexio-logo"
        style={{ fontSize: `${fontRem}rem` }}
        aria-label="LEXIO"
      >
        <span aria-hidden="true">LE</span>
        <span className="lexio-logo__x" aria-hidden="true">
          X
        </span>
        <span aria-hidden="true">IO</span>
      </h1>
    </div>
  );
}
