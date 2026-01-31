import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAppStore } from '../state/store';

interface AppShellProps {
  children: ReactNode;
  currentPage: 'editor' | 'settings';
  onNavigate: (page: 'editor' | 'settings') => void;
  onShowScreenPicker: () => void;
  onShowRegionOverlay: () => void;
  onShowWindowPicker: () => void;
}

export default function AppShell({
  children,
  currentPage,
  onNavigate,
  onShowScreenPicker,
  onShowRegionOverlay,
  onShowWindowPicker,
}: AppShellProps) {
  const history = useAppStore((state) => state.history);
  const currentCapture = useAppStore((state) => state.currentCapture);
  const setCurrentCapture = useAppStore((state) => state.setCurrentCapture);

  const handleFullScreen = () => {
    console.log('[AppShell] Full Screen clicked - calling onShowScreenPicker');
    onShowScreenPicker();
  };

  const handleRegion = () => {
    console.log('[AppShell] Region clicked - calling onShowRegionOverlay');
    onShowRegionOverlay();
  };

  const handleWindow = () => {
    console.log('[AppShell] Window clicked - calling onShowWindowPicker');
    onShowWindowPicker();
  };

  return (
    <div className="app-shell">
      <Header
        currentPage={currentPage}
        onNavigate={onNavigate}
        onCaptureFullScreen={handleFullScreen}
        onCaptureRegion={handleRegion}
        onCaptureWindow={handleWindow}
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
