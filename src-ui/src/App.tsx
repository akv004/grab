import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import AppShell from './components/AppShell';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import RegionOverlay from './components/RegionOverlay';
import WindowPicker from './components/WindowPicker';
import ScreenPicker from './components/ScreenPicker';
import { useAppStore } from './state/store';

type Page = 'editor' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('editor');
  const [showRegionOverlay, setShowRegionOverlay] = useState(false);
  const [showWindowPicker, setShowWindowPicker] = useState(false);
  const [showScreenPicker, setShowScreenPicker] = useState(false);
  const loadHistory = useAppStore((state) => state.loadHistory);
  const loadPreferences = useAppStore((state) => state.loadPreferences);
  const setCurrentCapture = useAppStore((state) => state.setCurrentCapture);

  // Debug logging for picker states
  useEffect(() => {
    console.log('[App] showScreenPicker changed to:', showScreenPicker);
  }, [showScreenPicker]);

  useEffect(() => {
    console.log('[App] showRegionOverlay changed to:', showRegionOverlay);
  }, [showRegionOverlay]);

  useEffect(() => {
    console.log('[App] showWindowPicker changed to:', showWindowPicker);
  }, [showWindowPicker]);

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

    const unlistenShowScreenPicker = listen('show-screen-picker', () => {
      console.log('show-screen-picker event received!');
      setShowScreenPicker(true);
    });

    const unlistenHistoryRefresh = listen('history:refresh', () => {
      loadHistory();
    });

    return () => {
      unlistenShowCapture.then((fn) => fn());
      unlistenOpenSettings.then((fn) => fn());
      unlistenStartRegionSelect.then((fn) => fn());
      unlistenShowWindowPicker.then((fn) => fn());
      unlistenShowScreenPicker.then((fn) => fn());
      unlistenHistoryRefresh.then((fn) => fn());
    };
  }, [loadHistory, loadPreferences, setCurrentCapture]);

  const handleRegionSelected = async (region: { x: number; y: number; width: number; height: number }) => {
    setShowRegionOverlay(false);
    try {
      const result = await invoke<{ file_path: string | null }>('capture_region', { region });
      loadHistory();
      if (result.file_path) {
        setCurrentCapture(result.file_path);
        setCurrentPage('editor');
      }
    } catch (error) {
      console.error('Region capture failed:', error);
    }
  };

  const handleWindowSelected = async (windowId: string) => {
    setShowWindowPicker(false);
    try {
      const result = await invoke<{ file_path: string | null }>('capture_window', { windowId });
      loadHistory();
      if (result.file_path) {
        setCurrentCapture(result.file_path);
        setCurrentPage('editor');
      }
    } catch (error) {
      console.error('Window capture failed:', error);
    }
  };

  const handleScreenSelected = async (screenId: string) => {
    setShowScreenPicker(false);
    try {
      const result = await invoke<{ file_path: string | null }>('capture_full_screen', { displayId: screenId });
      loadHistory();
      if (result.file_path) {
        setCurrentCapture(result.file_path);
        setCurrentPage('editor');
      }
    } catch (error) {
      console.error('Screen capture failed:', error);
    }
  };

  return (
    <>
      <AppShell
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onShowScreenPicker={() => setShowScreenPicker(true)}
        onShowRegionOverlay={() => setShowRegionOverlay(true)}
        onShowWindowPicker={() => setShowWindowPicker(true)}
      >
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

      {showScreenPicker && (
        <ScreenPicker
          onSelect={handleScreenSelected}
          onCancel={() => setShowScreenPicker(false)}
        />
      )}
    </>
  );
}

export default App;

