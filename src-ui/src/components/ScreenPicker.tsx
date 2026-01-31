import { useEffect, useState } from 'react';
import { useAppStore } from '../state/store';

interface ScreenPickerProps {
    onSelect: (screenId: string) => void;
    onCancel: () => void;
}

export default function ScreenPicker({ onSelect, onCancel }: ScreenPickerProps) {
    const screenSources = useAppStore((state) => state.screenSources);
    const loadScreenSources = useAppStore((state) => state.loadScreenSources);
    const [selectedScreen, setSelectedScreen] = useState<string | null>(null);

    useEffect(() => {
        console.log('ScreenPicker mounted, loading sources...');
        loadScreenSources();
    }, [loadScreenSources]);

    useEffect(() => {
        console.log('Screen sources updated:', screenSources);
    }, [screenSources]);

    const handleSelect = () => {
        if (selectedScreen) {
            onSelect(selectedScreen);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        } else if (e.key === 'Enter' && selectedScreen) {
            onSelect(selectedScreen);
        }
    };

    return (
        <div className="modal-overlay" onClick={onCancel} onKeyDown={handleKeyDown} tabIndex={0}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: '600px' }}>
                <div className="modal-header">
                    <h2>Select Screen</h2>
                    <button className="btn icon-only" onClick={onCancel}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="modal-content">
                    {screenSources.length === 0 ? (
                        <div className="empty-state" style={{ height: 'auto', padding: '48px' }}>
                            <p>Loading screens...</p>
                        </div>
                    ) : (
                        <div className="screen-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px' }}>
                            {screenSources.map((screen) => (
                                <div
                                    key={screen.id}
                                    className={`screen-item ${selectedScreen === screen.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedScreen(screen.id)}
                                    onDoubleClick={() => onSelect(screen.id)}
                                    style={{
                                        padding: '16px',
                                        border: selectedScreen === screen.id ? '2px solid var(--primary)' : '2px solid var(--border)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        background: selectedScreen === screen.id ? 'var(--bg-hover)' : 'transparent',
                                    }}
                                >
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                                        <rect x="2" y="3" width="20" height="14" rx="2" />
                                        <line x1="8" y1="21" x2="16" y2="21" />
                                        <line x1="12" y1="17" x2="12" y2="21" />
                                    </svg>
                                    <div style={{ fontWeight: 500 }}>{screen.name}</div>
                                    <div style={{ fontSize: '12px', opacity: 0.7 }}>ID: {screen.id}</div>
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
                        disabled={!selectedScreen}
                    >
                        Capture
                    </button>
                </div>
            </div>
        </div>
    );
}
