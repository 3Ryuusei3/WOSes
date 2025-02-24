import { useState } from 'react';

interface TooltipProps {
  message: string;
  children: React.ReactNode;
}

export default function Tooltip({ message, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      {isVisible && (
        <div className="tooltip-content">
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
