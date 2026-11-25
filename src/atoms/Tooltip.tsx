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
  const [position, setPosition] = useState<Position>({ top: 'auto', bottom: '2.5rem', left: '-0.625rem', right: 'auto' });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerType = useRef<string>("mouse");

  const updatePosition = () => {
    if (!tooltipRef.current || !containerRef.current) return;

    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    const positions: Position = {
      top: 'auto',
      bottom: '2.5rem',
      left: '-0.625rem',
      right: 'auto'
    };

    if (rect.right + tooltipRect.width > window.innerWidth) {
      positions.left = 'auto';
      positions.right = '0';
    }

    if (rect.left - tooltipRect.width < 0) {
      positions.left = '0';
    }

    if (rect.top - tooltipRect.height < 0) {
      positions.top = '2.5rem';
      positions.bottom = 'auto';
    }

    setPosition(positions);
  };

  // Open: a tap anywhere else closes it
  useEffect(() => {
    if (!isVisible) return;
    const close = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsVisible(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isVisible]);

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
      // Hover only with a real mouse; on touch screens a tap opens / closes
      // it (a tap also fires mouseenter, which used to open and close it)
      onPointerEnter={(e) => e.pointerType === "mouse" && setIsVisible(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setIsVisible(false)}
      onPointerDown={(e) => {
        pointerType.current = e.pointerType;
      }}
      onClick={(e) => {
        e.stopPropagation();
        // A mouse already opened it on hover: the click keeps it open
        if (pointerType.current === "mouse") setIsVisible(true);
        else setIsVisible((v) => !v);
      }}
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
