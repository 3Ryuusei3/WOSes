import logo from './../assets/logo.png';

interface GameLogoProps {
  /** Logo width (in px at the 16px base) when the large variant is shown. */
  width?: number;
  large?: boolean;
}

export default function GameLogo({ width = 150, large = false }: GameLogoProps) {
  // rem so the logo follows the fluid root font-size like everything else
  const widthRem = (large ? width : 80) / 16;
  return (
    <div className="logo-container">
      <img src={logo} alt='logo' style={{ width: `${widthRem}rem` }} className='logo' />
    </div>
  );
}
