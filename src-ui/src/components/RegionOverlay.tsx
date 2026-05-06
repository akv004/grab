import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, availableMonitors, LogicalPosition, LogicalSize } from '@tauri-apps/api/window';

interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RegionOverlayProps {
  onSelect: (region: RegionBounds, previewData: string) => void;
  onCancel: () => void;
}

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  decorated: boolean;
}

async function getSpanningBounds() {
  const monitors = await availableMonitors();
  if (monitors.length === 0) return { x: 0, y: 0, width: 1920, height: 1080 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const m of monitors) {
    const mx = m.position.x;
    const my = m.position.y;
    const mw = m.size.width / m.scaleFactor;
    const mh = m.size.height / m.scaleFactor;
    minX = Math.min(minX, mx);
    minY = Math.min(minY, my);
    maxX = Math.max(maxX, mx + mw);
    maxY = Math.max(maxY, my + mh);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

async function enterOverlayMode(): Promise<WindowState> {
  const win = getCurrentWindow();
  // Save current window state
  const pos = await win.outerPosition();
  const size = await win.outerSize();
  const decorated = await win.isDecorated();
  const saved: WindowState = {
    x: pos.x, y: pos.y,
    width: size.width, height: size.height,
    decorated,
  };

  const bounds = await getSpanningBounds();

  await win.setDecorations(false);
  await win.setAlwaysOnTop(true);
  await win.setPosition(new LogicalPosition(bounds.x, bounds.y));
  await win.setSize(new LogicalSize(bounds.width, bounds.height));
  await win.setFocus();

  return saved;
}

async function exitOverlayMode(saved: WindowState | null) {
  const win = getCurrentWindow();
  await win.setAlwaysOnTop(false);
  if (saved) {
    await win.setSize(new LogicalSize(saved.width, saved.height));
    await win.setPosition(new LogicalPosition(saved.x, saved.y));
    await win.setDecorations(saved.decorated);
  } else {
    await win.setDecorations(true);
  }
}

export default function RegionOverlay({ onSelect, onCancel }: RegionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const savedStateRef = useRef<WindowState | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [dashOffset, setDashOffset] = useState(0);
  const animationRef = useRef<number>();

  // Step 1: Hide window, capture screen, then show as overlay spanning all monitors
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const win = getCurrentWindow();
        await win.hide();
        await new Promise((r) => setTimeout(r, 250));
        const data = await invoke<string>('capture_screen_preview', {});
        if (cancelled) return;
        setPreviewData(data);
        setIsCapturing(false);
        await win.show();
        const saved = await enterOverlayMode();
        savedStateRef.current = saved;
      } catch (err) {
        console.error('Failed to capture screen preview:', err);
        if (!cancelled) {
          const win = getCurrentWindow();
          await win.show().catch(() => {});
          await exitOverlayMode(savedStateRef.current).catch(() => {});
          onCancel();
        }
      }
    })();
    return () => { cancelled = true; };
  }, [onCancel]);

  // Cleanup: restore window on unmount
  useEffect(() => {
    return () => {
      exitOverlayMode(savedStateRef.current).catch(() => {});
    };
  }, []);

  // Step 2: Draw preview on canvas
  useEffect(() => {
    if (!previewData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = previewData;

    const animate = () => {
      setDashOffset((prev) => (prev + 0.5) % 12);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [previewData]);

  // Redraw canvas with selection
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imgRef.current;
    if (!canvas || !ctx || !img) return;

    ctx.drawImage(img, 0, 0);
    if (!isSelecting) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const sx = startPos.x * scaleX;
    const sy = startPos.y * scaleY;
    const cx = currentPos.x * scaleX;
    const cy = currentPos.y * scaleY;

    const x = Math.min(sx, cx);
    const y = Math.min(sy, cy);
    const w = Math.abs(cx - sx);
    const h = Math.abs(cy - sy);

    if (w > 0 && h > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvas.width, y);
      ctx.fillRect(0, y + h, canvas.width, canvas.height - y - h);
      ctx.fillRect(0, y, x, h);
      ctx.fillRect(x + w, y, canvas.width - x - w, h);

      ctx.strokeStyle = '#007ACC';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, w, h);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -dashOffset;
      ctx.strokeRect(x, y, w, h);

      const handleSize = 8;
      ctx.fillStyle = '#007ACC';
      ctx.setLineDash([]);
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);

      const dimW = Math.round(w);
      const dimH = Math.round(h);
      const label = `${dimW} × ${dimH}`;
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(label).width;
      const labelX = x + w / 2 - textWidth / 2 - 6;
      const labelY = y + h + 8;
      ctx.fillRect(labelX, labelY, textWidth + 12, 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, labelX + 6, labelY + 16);
    }
  }, [isSelecting, startPos, currentPos, dashOffset]);

  const handleCancel = useCallback(async () => {
    await exitOverlayMode(savedStateRef.current);
    onCancel();
  }, [onCancel]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) {
      handleCancel();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setIsSelecting(true);
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCurrentPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [handleCancel]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setCurrentPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [isSelecting]
  );

  const handleMouseUp = useCallback(async () => {
    if (!isSelecting || !previewData) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round(Math.min(startPos.x, currentPos.x) * scaleX);
    const y = Math.round(Math.min(startPos.y, currentPos.y) * scaleY);
    const w = Math.round(Math.abs(currentPos.x - startPos.x) * scaleX);
    const h = Math.round(Math.abs(currentPos.y - startPos.y) * scaleY);

    setIsSelecting(false);
    if (w < 10 || h < 10) return;

    await exitOverlayMode(savedStateRef.current);
    onSelect({ x, y, width: w, height: h }, previewData);
  }, [isSelecting, startPos, currentPos, previewData, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    },
    [handleCancel]
  );

  if (isCapturing) {
    return (
      <div className="region-overlay" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000',
      }}>
        <div style={{ color: '#fff', fontSize: '18px' }}>Capturing screen...</div>
      </div>
    );
  }

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
      {!isSelecting && (
        <div className="region-instructions">
          Click and drag to select a region. Press <strong>Escape</strong> to cancel.
        </div>
      )}
    </div>
  );
}
