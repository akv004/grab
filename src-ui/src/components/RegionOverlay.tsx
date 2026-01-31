import { useCallback, useEffect, useRef, useState } from 'react';

interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RegionOverlayProps {
  onSelect: (region: RegionBounds) => void;
  onCancel: () => void;
}

export default function RegionOverlay({ onSelect, onCancel }: RegionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [dashOffset, setDashOffset] = useState(0);
  const animationRef = useRef<number>();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Start marching ants animation
    const animate = () => {
      setDashOffset((prev) => (prev + 0.5) % 12);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Draw selection
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isSelecting) return;

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const w = Math.abs(currentPos.x - startPos.x);
    const h = Math.abs(currentPos.y - startPos.y);

    if (w > 0 && h > 0) {
      // Selection border - solid blue
      ctx.strokeStyle = '#007ACC';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, w, h);

      // Animated dashed overlay
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -dashOffset;
      ctx.strokeRect(x, y, w, h);

      // Corner handles
      const handleSize = 8;
      ctx.fillStyle = '#007ACC';
      ctx.setLineDash([]);

      // Top-left
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      // Top-right
      ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      // Bottom-left
      ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
      // Bottom-right
      ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
    }
  }, [isSelecting, startPos, currentPos, dashOffset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) {
      onCancel();
      return;
    }

    setIsSelecting(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  }, [onCancel]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting) return;
      setCurrentPos({ x: e.clientX, y: e.clientY });
    },
    [isSelecting]
  );

  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const w = Math.abs(currentPos.x - startPos.x);
    const h = Math.abs(currentPos.y - startPos.y);

    setIsSelecting(false);

    // Minimum size check
    if (w < 10 || h < 10) {
      return;
    }

    onSelect({ x, y, width: w, height: h });
  }, [isSelecting, startPos, currentPos, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  const dimensions = isSelecting
    ? `${Math.abs(currentPos.x - startPos.x)} × ${Math.abs(currentPos.y - startPos.y)} px`
    : '';

  return (
    <div
      className="region-overlay"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      autoFocus
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {isSelecting && dimensions && (
        <div
          className="region-tooltip"
          style={{
            left: currentPos.x + 15,
            top: currentPos.y + 15,
          }}
        >
          {dimensions}
        </div>
      )}

      {!isSelecting && (
        <div className="region-instructions">
          Click and drag to select a region. Press <strong>Escape</strong> to cancel.
        </div>
      )}
    </div>
  );
}
