interface HeaderProps {
  currentPage: 'editor' | 'settings';
  onNavigate: (page: 'editor' | 'settings') => void;
  onCaptureFullScreen: () => void;
  onCaptureRegion: () => void;
  onCaptureWindow: () => void;
}

export default function Header({
  currentPage,
  onNavigate,
  onCaptureFullScreen,
  onCaptureRegion,
  onCaptureWindow,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 600 }}>Grab</h1>
        
        <div className="nav-tabs">
          <button
            className={`nav-tab ${currentPage === 'editor' ? 'active' : ''}`}
            onClick={() => onNavigate('editor')}
          >
            Editor
          </button>
          <button
            className={`nav-tab ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="btn" onClick={onCaptureFullScreen} title="Capture Full Screen (Cmd+Shift+1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          Full Screen
        </button>
        <button className="btn" onClick={onCaptureRegion} title="Capture Region (Cmd+Shift+2)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3v18M19 3v18M3 5h18M3 19h18" />
          </svg>
          Region
        </button>
        <button className="btn" onClick={onCaptureWindow} title="Capture Window (Cmd+Shift+3)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 8h20" />
          </svg>
          Window
        </button>
      </div>
    </header>
  );
}
