import logo from './../assets/logo.png';

interface GameLogoProps {
  width?: number;
}

export default function GameLogo({ width = 150 }: GameLogoProps) {
  return (
    <div className="logo-container">
      <img src={logo} alt='logo' width={width} className='logo' />
    </div>
  );
}
