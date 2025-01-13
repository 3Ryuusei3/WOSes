import logo from './../assets/logo.png';

interface GameLogoProps {
  width?: number;
}

export default function GameLogo({ width = 180 }: GameLogoProps) {
  return (
    <img src={logo} alt='logo' width={width} className='logo' />
  )
}
