import { HistoryItem } from '../state/store';

interface SidebarProps {
  history: HistoryItem[];
  currentCapture: string | null;
  onSelectCapture: (path: string) => void;
}

export default function Sidebar({ history, currentCapture, onSelectCapture }: SidebarProps) {
  // Group history by date
  const groupedHistory = groupByDate(history);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">History</div>
      <div className="sidebar-content">
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
                    className={`history-item ${currentCapture === item.filePath ? 'active' : ''}`}
                    onClick={() => onSelectCapture(item.filePath)}
                  >
                    <div
                      className="history-thumb"
                      style={{
                        backgroundImage: `url('${convertFilePath(item.filePath)}')`,
                      }}
                    />
                    <div className="history-info">
                      <div className="history-name">
                        {getFileName(item.filePath)}
                      </div>
                      <div className="history-date">
                        {formatTime(item.timestamp)}
                      </div>
                    </div>
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

function convertFilePath(path: string): string {
  // Convert file path to asset URL for Tauri
  // In Tauri 2, we use the asset protocol
  return `asset://localhost/${encodeURIComponent(path)}`;
}
