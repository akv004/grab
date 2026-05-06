import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { startDrag } from '@crabnebula/tauri-plugin-drag';
import { HistoryItem } from '../state/store';

interface SidebarProps {
  history: HistoryItem[];
  currentCapture: string | null;
  onSelectCapture: (path: string) => void;
}

// Lazy loaded thumbnail component - only loads when visible
function LazyThumbnail({ filePath, isVisible }: { filePath: string; isVisible: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && !url) {
      setUrl(`asset://localhost/${encodeURIComponent(filePath)}`);
    }
  }, [isVisible, filePath, url]);

  if (!isVisible || !url) {
    return <div className="history-thumb history-thumb-placeholder" />;
  }

  return (
    <div
      className={`history-thumb ${loaded ? '' : 'loading'}`}
      style={{
        backgroundImage: loaded ? `url('${url}')` : undefined,
      }}
    >
      <img
        src={url}
        alt=""
        style={{ display: 'none' }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
}

export default function Sidebar({ history, currentCapture, onSelectCapture }: SidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const dragIconRef = useRef<string | null>(null);

  useEffect(() => {
    invoke<string>('get_drag_icon_path')
      .then((path) => { dragIconRef.current = path; })
      .catch(() => { dragIconRef.current = null; });
  }, []);

  const handleCopyImage = useCallback(async (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    try {
      await invoke('copy_to_clipboard', { data: item.filePath });
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, item: HistoryItem) => {
    e.preventDefault();
    startDrag({
      item: [item.filePath],
      icon: dragIconRef.current ?? '',
    }).catch((err) => console.error('Native drag failed:', err));
  }, []);

  // Use IntersectionObserver for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-id');
          if (id) {
            setVisibleItems((prev) => {
              const next = new Set(prev);
              if (entry.isIntersecting) {
                next.add(id);
              }
              return next;
            });
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0,
      }
    );

    const items = containerRef.current?.querySelectorAll('.history-item');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [history]);

  const groupedHistory = groupByDate(history);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">History</div>
      <div className="sidebar-content" ref={containerRef}>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <p style={{ fontSize: '12px' }}>No captures yet</p>
            </div>
          ) : (
            Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date}>
                <div className="history-group-header">{date}</div>
                {items.map((item) => (
                  <div
                    key={item.id}
                    data-id={item.id}
                    className={`history-item ${currentCapture === item.filePath ? 'active' : ''}`}
                    onClick={() => onSelectCapture(item.filePath)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    title="Drag to share, click to open"
                  >
                    <LazyThumbnail
                      filePath={item.filePath}
                      isVisible={visibleItems.has(item.id)}
                    />
                    <div className="history-info">
                      <div className="history-name">
                        {getFileName(item.filePath)}
                      </div>
                      <div className="history-date">
                        {formatTime(item.timestamp)}
                      </div>
                    </div>
                    <button
                      className={`copy-btn ${copiedId === item.id ? 'copied' : ''}`}
                      title="Copy image to clipboard (Ctrl+V to paste into Claude)"
                      onClick={(e) => handleCopyImage(e, item)}
                    >
                      {copiedId === item.id ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

// Helper functions
function groupByDate(items: HistoryItem[]): Record<string, HistoryItem[]> {
  const groups: Record<string, HistoryItem[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  items.forEach((item) => {
    const date = new Date(item.timestamp);
    let groupName: string;

    if (date.toDateString() === today.toDateString()) {
      groupName = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupName = 'Yesterday';
    } else {
      groupName = date.toLocaleDateString();
    }

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(item);
  });

  return groups;
}

function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
