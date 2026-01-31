import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import AppShell from './components/AppShell';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import RegionOverlay from './components/RegionOverlay';
import WindowPicker from './components/WindowPicker';
import { useAppStore } from './state/store';

type Page = 'editor' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('editor');
  const [showRegionOverlay, setShowRegionOverlay] = useState(false);
  const [showWindowPicker, setShowWindowPicker] = useState(false);
  const loadHistory = useAppStore((state) => state.loadHistory);
  const loadPreferences = useAppStore((state) => state.loadPreferences);
  const setCurrentCapture = useAppStore((state) => state.setCurrentCapture);

  useEffect(() => {
    // Load initial data
    loadHistory();
    loadPreferences();

    // Listen for Tauri events
    const unlistenShowCapture = listen<string>('show-capture', (event) => {
      setCurrentCapture(event.payload);
      setCurrentPage('editor');
    });

    const unlistenOpenSettings = listen('open-settings', () => {
      setCurrentPage('settings');
    });

    const unlistenStartRegionSelect = listen('start-region-select', () => {
      setShowRegionOverlay(true);
    });

    const unlistenShowWindowPicker = listen('show-window-picker', () => {
      setShowWindowPicker(true);
    });

    const unlistenHistoryRefresh = listen('history:refresh', () => {
      loadHistory();
    });

    return () => {
      unlistenShowCapture.then((fn) => fn());
      unlistenOpenSettings.then((fn) => fn());
      unlistenStartRegionSelect.then((fn) => fn());
      unlistenShowWindowPicker.then((fn) => fn());
      unlistenHistoryRefresh.then((fn) => fn());
    };
  }, [loadHistory, loadPreferences, setCurrentCapture]);

  const handleRegionSelected = async (region: { x: number; y: number; width: number; height: number }) => {
    setShowRegionOverlay(false);
    // Trigger region capture via Tauri command
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('capture_region', { region });
      loadHistory();
    } catch (error) {
      console.error('Region capture failed:', error);
    }
  };

  const handleWindowSelected = async (windowId: string) => {
    setShowWindowPicker(false);
    // Trigger window capture via Tauri command
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      await invoke('capture_window', { windowId });
      loadHistory();
    } catch (error) {
      console.error('Window capture failed:', error);
    }
  };

  return (
    <>
      <AppShell currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === 'editor' && <Editor />}
        {currentPage === 'settings' && <Settings />}
      </AppShell>

      {showRegionOverlay && (
        <RegionOverlay
          onSelect={handleRegionSelected}
          onCancel={() => setShowRegionOverlay(false)}
        />
      )}

      {showWindowPicker && (
        <WindowPicker
          onSelect={handleWindowSelected}
          onCancel={() => setShowWindowPicker(false)}
        />
      )}
    </>
  );
}

export default App;
