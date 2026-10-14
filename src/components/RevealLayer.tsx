import React, { useEffect, useRef, useState, useMemo } from 'react';

interface RevealLayerProps {
  image: string;
  cursorX: number;
  cursorY: number;
}

const SPOTLIGHT_R = 260;

export const RevealLayer: React.FC<RevealLayerProps> = ({ image, cursorX, cursorY }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrlMask, setDataUrlMask] = useState<string>('');
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  // Track window resize to ensure canvas matches screen
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update canvas & mask on each cursor coordinate change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = dimensions;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // If cursor is off-screen, clear mask
    if (cursorX < -500 || cursorY < -500) {
      setDataUrlMask('');
      return;
    }

    // Build the radial gradient according to exact specification
    const gradient = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, SPOTLIGHT_R);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.75)');
    gradient.addColorStop(0.75, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.88, 'rgba(255, 255, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fill();

    try {
      const url = canvas.toDataURL('image/png');
      setDataUrlMask(url);
    } catch {
      // Fallback in case of canvas security restriction
    }
  }, [cursorX, cursorY, dimensions]);

  // CSS mask string combining hardware-accelerated radial gradient & canvas data URL
  const maskStyle = useMemo(() => {
    if (cursorX < -500 || cursorY < -500) {
      return {
        maskImage: 'none',
        WebkitMaskImage: 'none',
      };
    }

    // Direct high-efficiency CSS radial gradient combined with canvas dataURL
    const cssGradient = `radial-gradient(circle ${SPOTLIGHT_R}px at ${cursorX}px ${cursorY}px, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 40%, rgba(255,255,255,0.75) 60%, rgba(255,255,255,0.4) 75%, rgba(255,255,255,0.12) 88%, rgba(255,255,255,0) 100%)`;
    const finalMask = dataUrlMask ? `url(${dataUrlMask})` : cssGradient;

    return {
      maskImage: finalMask,
      WebkitMaskImage: finalMask,
      maskSize: '100% 100%',
      WebkitMaskSize: '100% 100%',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
    };
  }, [dataUrlMask, cursorX, cursorY]);

  return (
    <>
      {/* Hidden canvas for exact spotlight mask rendering */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: 'none' }}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* Reveal div with BG_IMAGE_2 visible only within soft circular cursor spotlight */}
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none transition-opacity duration-150"
        style={{
          backgroundImage: `url(${image})`,
          ...maskStyle,
        }}
      />
    </>
  );
};
