import { useEffect, useRef, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../state/store';
import EditorToolbar from '../components/EditorToolbar';
import EditorCanvas from '../components/EditorCanvas';

type Tool = 'crop' | 'focus' | 'blur' | null;

export default function Editor() {
  const currentCapture = useAppStore((state) => state.currentCapture);
  const loadHistory = useAppStore((state) => state.loadHistory);
  const [currentTool, setCurrentTool] = useState<Tool>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image when currentCapture changes
  useEffect(() => {
    const loadImage = async () => {
      if (currentCapture) {
        console.log('[Editor] Loading capture:', currentCapture);
        // For file paths, use Tauri's convertFileSrc
        if (currentCapture.startsWith('data:')) {
          setImageDataUrl(currentCapture);
        } else {
          try {
            const { convertFileSrc } = await import('@tauri-apps/api/core');
            const url = convertFileSrc(currentCapture);
            console.log('[Editor] Converted URL:', url);
            setImageDataUrl(url);
          } catch (error) {
            console.error('[Editor] Failed to convert file src:', error);
            // Fallback: try direct file path for development
            setImageDataUrl(`file://${currentCapture}`);
          }
        }
      } else {
        setImageDataUrl(null);
      }
    };
    loadImage();
  }, [currentCapture]);

  const handleCopy = async () => {
    if (!currentCapture && !imageDataUrl) return;
    try {
      await invoke('copy_to_clipboard', {
        data: imageDataUrl?.startsWith('data:') ? imageDataUrl : currentCapture,
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleSave = async () => {
    if (!currentCapture && !imageDataUrl) return;
    try {
      await invoke('save_image', {
        data: imageDataUrl?.startsWith('data:') ? imageDataUrl : currentCapture,
        defaultPath: currentCapture ? getFileName(currentCapture) : 'capture.png',
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleReveal = async () => {
    if (!currentCapture) return;
    try {
      await invoke('reveal_in_folder', { filePath: currentCapture });
    } catch (error) {
      console.error('Reveal failed:', error);
    }
  };

  const handleDelete = async () => {
    if (!currentCapture) return;
    if (!confirm('Delete this screenshot?')) return;

    try {
      await invoke('delete_screenshot', { filePath: currentCapture });
      loadHistory();
      setImageDataUrl(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleCropApply = useCallback((croppedDataUrl: string) => {
    setImageDataUrl(croppedDataUrl);
    setCurrentTool(null);
  }, []);

  if (!imageDataUrl) {
    return (
      <div className="empty-state">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <h3>No Image Selected</h3>
        <p>
          Capture a screenshot or select one from the history to start editing.
        </p>
      </div>
    );
  }

  return (
    <>
      <EditorToolbar
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        onCopy={handleCopy}
        onSave={handleSave}
        onReveal={handleReveal}
        onDelete={handleDelete}
        hasImage={!!imageDataUrl}
      />
      <EditorCanvas
        imageUrl={imageDataUrl}
        currentTool={currentTool}
        onCropApply={handleCropApply}
        imageRef={imageRef}
      />
    </>
  );
}

function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || 'capture.png';
}
