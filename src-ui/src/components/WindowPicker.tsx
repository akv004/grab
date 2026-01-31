import { useEffect, useState } from 'react';
import { useAppStore } from '../state/store';

interface WindowPickerProps {
  onSelect: (windowId: string) => void;
  onCancel: () => void;
}

export default function WindowPicker({ onSelect, onCancel }: WindowPickerProps) {
  const windowSources = useAppStore((state) => state.windowSources);
  const loadWindowSources = useAppStore((state) => state.loadWindowSources);
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);

  useEffect(() => {
    loadWindowSources();
  }, [loadWindowSources]);

  const handleSelect = () => {
    if (selectedWindow) {
      onSelect(selectedWindow);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && selectedWindow) {
      onSelect(selectedWindow);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: '600px' }}>
        <div className="modal-header">
          <h2>Select Window</h2>
          <button className="btn icon-only" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {windowSources.length === 0 ? (
            <div className="empty-state" style={{ height: 'auto', padding: '48px' }}>
              <p>No windows found</p>
            </div>
          ) : (
            <div className="window-grid">
              {windowSources.map((window) => (
                <div
                  key={window.id}
                  className={`window-item ${selectedWindow === window.id ? 'selected' : ''}`}
                  onClick={() => setSelectedWindow(window.id)}
                  onDoubleClick={() => onSelect(window.id)}
                >
                  <div className="window-item-name" title={window.name}>
                    {window.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={handleSelect}
            disabled={!selectedWindow}
          >
            Capture
          </button>
        </div>
      </div>
    </div>
  );
}
