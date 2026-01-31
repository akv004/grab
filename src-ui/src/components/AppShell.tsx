import { ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAppStore } from '../state/store';

interface AppShellProps {
  children: ReactNode;
  currentPage: 'editor' | 'settings';
  onNavigate: (page: 'editor' | 'settings') => void;
}

export default function AppShell({ children, currentPage, onNavigate }: AppShellProps) {
  const history = useAppStore((state) => state.history);
  const currentCapture = useAppStore((state) => state.currentCapture);
  const setCurrentCapture = useAppStore((state) => state.setCurrentCapture);
  const loadHistory = useAppStore((state) => state.loadHistory);

  const handleCaptureFullScreen = async () => {
    try {
      await invoke('capture_full_screen');
      loadHistory();
    } catch (error) {
      console.error('Full screen capture failed:', error);
    }
  };

  const handleCaptureRegion = async () => {
    // Emit event to show region overlay
    const { emit } = await import('@tauri-apps/api/event');
    emit('start-region-select');
  };

  const handleCaptureWindow = async () => {
    // Emit event to show window picker
    const { emit } = await import('@tauri-apps/api/event');
    emit('show-window-picker');
  };

  return (
    <div className="app-shell">
      <Header
        currentPage={currentPage}
        onNavigate={onNavigate}
        onCaptureFullScreen={handleCaptureFullScreen}
        onCaptureRegion={handleCaptureRegion}
        onCaptureWindow={handleCaptureWindow}
      />
      <div className="app-main">
        {currentPage === 'editor' && (
          <Sidebar
            history={history}
            currentCapture={currentCapture}
            onSelectCapture={setCurrentCapture}
          />
        )}
        <div className="editor-container">
          {children}
        </div>
      </div>
    </div>
  );
}
