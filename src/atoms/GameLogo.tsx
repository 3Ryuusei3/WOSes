import logo from "../assets/lexio-logo.svg";

interface GameLogoProps {
  /** Logo width (in px at the 16px base) when the large variant is shown. */
  width?: number;
  large?: boolean;
  /** Line under the logo (start screen) */
  tagline?: string;
}

/**
 * LEXIO wordmark (logo 1·6 B: cream letters, loose tilted yellow X). An SVG
 * with the letters as shapes, so it looks the same everywhere.
 */
export default function GameLogo({
  width = 230,
  large = false,
  tagline,
}: GameLogoProps) {
  // rem so the logo follows the fluid root font-size like everything else
  const widthRem = (large ? width : 110) / 16;
  return (
    <div className={`logo-container ${tagline ? "logo-container--hero" : ""}`}>
      <h1 className="logo-heading">
        <img
          src={logo}
          alt="LEXIO"
          className="logo lexio-logo"
          style={{ width: `${widthRem}rem` }}
        />
      </h1>
      {tagline && <p className="logo-tagline">{tagline}</p>}
    </div>
  );
}
