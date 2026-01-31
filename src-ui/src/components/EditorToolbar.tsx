type Tool = 'crop' | 'focus' | 'blur' | null;

interface EditorToolbarProps {
  currentTool: Tool;
  onSelectTool: (tool: Tool) => void;
  onCopy: () => void;
  onSave: () => void;
  onReveal: () => void;
  onDelete: () => void;
  hasImage: boolean;
}

export default function EditorToolbar({
  currentTool,
  onSelectTool,
  onCopy,
  onSave,
  onReveal,
  onDelete,
  hasImage,
}: EditorToolbarProps) {
  return (
    <div className="editor-toolbar">
      {/* Editing Tools */}
      <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--border)', paddingRight: '12px' }}>
        <button
          className={`tool-btn ${currentTool === 'crop' ? 'active' : ''}`}
          onClick={() => onSelectTool(currentTool === 'crop' ? null : 'crop')}
          title="Crop (C)"
          disabled={!hasImage}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
            <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
          </svg>
        </button>
        <button
          className={`tool-btn ${currentTool === 'focus' ? 'active' : ''}`}
          onClick={() => onSelectTool(currentTool === 'focus' ? null : 'focus')}
          title="Focus (F)"
          disabled={!hasImage}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button
          className={`tool-btn ${currentTool === 'blur' ? 'active' : ''}`}
          onClick={() => onSelectTool(currentTool === 'blur' ? null : 'blur')}
          title="Blur (B)"
          disabled={!hasImage}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
          </svg>
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button className="btn" onClick={onCopy} disabled={!hasImage} title="Copy to Clipboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </button>
        <button className="btn primary" onClick={onSave} disabled={!hasImage} title="Save As">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Save
        </button>
        <button className="btn" onClick={onReveal} disabled={!hasImage} title="Reveal in Finder">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Reveal
        </button>
        <button className="btn danger" onClick={onDelete} disabled={!hasImage} title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
