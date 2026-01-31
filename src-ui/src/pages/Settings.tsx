import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../state/store';

export default function Settings() {
  const preferences = useAppStore((state) => state.preferences);
  const loadPreferences = useAppStore((state) => state.loadPreferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);

  useEffect(() => {
    if (!preferences) {
      loadPreferences();
    }
  }, [preferences, loadPreferences]);

  if (!preferences) {
    return <div className="settings-container">Loading...</div>;
  }

  const handleToggle = (key: keyof typeof preferences) => {
    const currentValue = preferences[key];
    if (typeof currentValue === 'boolean') {
      updatePreferences({ [key]: !currentValue });
    }
  };

  const handleBrowseFolder = async () => {
    try {
      const folder = await invoke<string | null>('browse_folder');
      if (folder) {
        updatePreferences({ outputFolder: folder });
      }
    } catch (error) {
      console.error('Browse folder failed:', error);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-section">
        <h2>Capture Behavior</h2>
        
        <div className="settings-row">
          <div className="settings-label">
            <span>Hide Editor During Capture</span>
            <small>Minimize the editor window when capturing</small>
          </div>
          <div
            className={`toggle ${preferences.hideEditorDuringCapture ? 'on' : ''}`}
            onClick={() => handleToggle('hideEditorDuringCapture')}
          />
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <span>Copy to Clipboard</span>
            <small>Automatically copy captures to clipboard</small>
          </div>
          <div
            className={`toggle ${preferences.copyToClipboard ? 'on' : ''}`}
            onClick={() => handleToggle('copyToClipboard')}
          />
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <span>Save to Disk</span>
            <small>Automatically save captures to disk</small>
          </div>
          <div
            className={`toggle ${preferences.saveToDisk ? 'on' : ''}`}
            onClick={() => handleToggle('saveToDisk')}
          />
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <span>Show Notifications</span>
            <small>Show notifications after capture</small>
          </div>
          <div
            className={`toggle ${preferences.showNotifications ? 'on' : ''}`}
            onClick={() => handleToggle('showNotifications')}
          />
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <span>Open Editor After Capture</span>
            <small>Automatically open the editor after each capture</small>
          </div>
          <div
            className={`toggle ${preferences.openEditorAfterCapture ? 'on' : ''}`}
            onClick={() => handleToggle('openEditorAfterCapture')}
          />
        </div>
      </div>

      <div className="settings-section">
        <h2>Output</h2>
        
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className="settings-label" style={{ marginBottom: '8px' }}>
            <span>Output Folder</span>
            <small>Where captures are saved</small>
          </div>
          <div className="input-group">
            <input
              type="text"
              className="input-field"
              value={preferences.outputFolder}
              readOnly
            />
            <button className="btn" onClick={handleBrowseFolder}>
              Browse
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>Keyboard Shortcuts</h2>
        
        <div className="settings-row">
          <div className="settings-label">
            <span>Full Screen Capture</span>
          </div>
          <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>
            {preferences.shortcuts.fullScreen.replace('CommandOrControl', '⌘/Ctrl')}
          </code>
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <span>Region Capture</span>
          </div>
          <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>
            {preferences.shortcuts.region.replace('CommandOrControl', '⌘/Ctrl')}
          </code>
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <span>Window Capture</span>
          </div>
          <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>
            {preferences.shortcuts.window.replace('CommandOrControl', '⌘/Ctrl')}
          </code>
        </div>
      </div>

      <div className="settings-section">
        <h2>About</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Grab v2.0.0 - Built with Tauri + React
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
          A lightweight, developer-friendly screen capture tool
        </p>
      </div>
    </div>
  );
}
