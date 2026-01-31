import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

type Tool = 'crop' | 'focus' | 'blur' | null;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface EditorCanvasProps {
  imageUrl: string;
  currentTool: Tool;
  onCropApply: (dataUrl: string) => void;
  imageRef: RefObject<HTMLImageElement>;
}

export default function EditorCanvas({
  imageUrl,
  currentTool,
  onCropApply,
  imageRef,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Resize canvas to match image
  const resizeCanvas = useCallback(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.complete) return;

    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = `${img.width}px`;
    canvas.style.height = `${img.height}px`;
    canvas.style.left = `${img.offsetLeft}px`;
    canvas.style.top = `${img.offsetTop}px`;
  }, [imageRef]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    resizeCanvas();
  }, [resizeCanvas]);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Draw overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!currentRect || !currentTool) return;

    if (currentTool === 'focus') {
      // Dim entire screen
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cut out focus area
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.globalCompositeOperation = 'source-over';

      // Border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
    } else if (currentTool === 'crop') {
      // Dashed selection
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.setLineDash([]);

      // Dim outside
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, currentRect.y); // Top
      ctx.fillRect(0, currentRect.y + currentRect.h, canvas.width, canvas.height - (currentRect.y + currentRect.h)); // Bottom
      ctx.fillRect(0, currentRect.y, currentRect.x, currentRect.h); // Left
      ctx.fillRect(currentRect.x + currentRect.w, currentRect.y, canvas.width - (currentRect.x + currentRect.w), currentRect.h); // Right
    } else if (currentTool === 'blur') {
      // Blur indicator
      ctx.strokeStyle = '#007ACC';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 2;
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.setLineDash([]);
    }
  }, [currentRect, currentTool]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!currentTool) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDrawing(true);
      setStartPos({ x, y });
      setCurrentRect({ x, y, w: 0, h: 0 });
    },
    [currentTool]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !currentTool) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      setCurrentRect({
        x: Math.min(startPos.x, currentX),
        y: Math.min(startPos.y, currentY),
        w: Math.abs(currentX - startPos.x),
        h: Math.abs(currentY - startPos.y),
      });
    },
    [isDrawing, currentTool, startPos]
  );

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Handle crop apply
  const applyCrop = useCallback(() => {
    if (!currentRect || currentRect.w <= 0 || currentRect.h <= 0) return;
    const img = imageRef.current;
    if (!img) return;

    // Scale factor
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Map to natural coordinates
    const sourceX = currentRect.x * scaleX;
    const sourceY = currentRect.y * scaleY;
    const sourceW = currentRect.w * scaleX;
    const sourceH = currentRect.h * scaleY;

    // Create temp canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sourceW;
    tempCanvas.height = sourceH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);

    const dataUrl = tempCanvas.toDataURL('image/png');
    onCropApply(dataUrl);
    setCurrentRect(null);
  }, [currentRect, imageRef, onCropApply]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Enter' && currentTool === 'crop' && currentRect) {
        applyCrop();
      } else if (e.key === 'Escape') {
        setCurrentRect(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTool, currentRect, applyCrop]);

  return (
    <div className="editor-canvas-wrapper" ref={containerRef}>
      <div style={{ position: 'relative' }}>
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Capture"
          className="editor-preview"
          onLoad={handleImageLoad}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
        {imageLoaded && (
          <canvas
            ref={canvasRef}
            className="editor-canvas"
            style={{
              position: 'absolute',
              cursor: currentTool ? 'crosshair' : 'default',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        )}
      </div>
      {currentTool === 'crop' && currentRect && currentRect.w > 10 && currentRect.h > 10 && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-secondary)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        >
          Press <strong>Enter</strong> to apply crop, <strong>Escape</strong> to cancel
        </div>
      )}
    </div>
  );
}
