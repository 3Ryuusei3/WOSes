import logo from './../assets/logo.png';

interface GameLogoProps {
  width?: number;
  isZoomed?: boolean;
}

export default function GameLogo({ width = 150, isZoomed = false }: GameLogoProps) {
  return (
    <div className="logo-container">
      <img src={logo} alt='logo' width={isZoomed ? width : 80} className='logo' />
    </div>
  );
}
