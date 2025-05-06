import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  message: string;
  children: React.ReactNode;
}

interface Position {
  top: string;
  bottom: string;
  left: string;
  right: string;
}

export default function Tooltip({ message, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 'auto', bottom: '40px', left: '-10px', right: 'auto' });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!tooltipRef.current || !containerRef.current) return;

    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    const positions: Position = {
      top: 'auto',
      bottom: '40px',
      left: '-10px',
      right: 'auto'
    };

    // Check if tooltip would overflow right edge
    if (rect.right + tooltipRect.width > window.innerWidth) {
      positions.left = 'auto';
      positions.right = '0';
    }

    // Check if tooltip would overflow left edge
    if (rect.left - tooltipRect.width < 0) {
      positions.left = '0';
    }

    // Check if tooltip would overflow bottom edge
    if (rect.top - tooltipRect.height < 0) {
      positions.top = '40px';
      positions.bottom = 'auto';
    }

    setPosition(positions);
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="tooltip-content"
          style={{
            top: position.top,
            bottom: position.bottom,
            left: position.left,
            right: position.right
          }}
        >
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
