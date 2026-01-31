import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

// Types
export interface HistoryItem {
  id: string;
  filePath: string;
  timestamp: string;
  thumbnail?: string;
}

export interface CapturePreferences {
  outputFolder: string;
  copyToClipboard: boolean;
  saveToDisk: boolean;
  defaultMode: string;
  namingTemplate: string;
  shortcuts: {
    fullScreen: string;
    region: string;
    window: string;
  };
  openEditorAfterCapture: boolean;
  hideEditorDuringCapture: boolean;
  showNotifications: boolean;
}

export interface CaptureSource {
  id: string;
  name: string;
  thumbnail?: string;
  displayId?: string;
  appIcon?: string;
}

interface AppState {
  // History
  history: HistoryItem[];
  loadHistory: () => Promise<void>;
  removeFromHistory: (filePath: string) => Promise<void>;

  // Current capture
  currentCapture: string | null;
  setCurrentCapture: (path: string | null) => void;

  // Preferences
  preferences: CapturePreferences | null;
  loadPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<CapturePreferences>) => Promise<void>;

  // Sources
  screenSources: CaptureSource[];
  windowSources: CaptureSource[];
  loadScreenSources: () => Promise<void>;
  loadWindowSources: () => Promise<void>;

  // UI State
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // History
  history: [],
  loadHistory: async () => {
    try {
      set({ isLoading: true });
      const history = await invoke<HistoryItem[]>('get_history');
      set({ history, isLoading: false });
    } catch (error) {
      console.error('Failed to load history:', error);
      set({ error: String(error), isLoading: false });
    }
  },
  removeFromHistory: async (filePath: string) => {
    try {
      await invoke('remove_from_history', { filePath });
      const history = get().history.filter((item) => item.filePath !== filePath);
      set({ history });
    } catch (error) {
      console.error('Failed to remove from history:', error);
      set({ error: String(error) });
    }
  },

  // Current capture
  currentCapture: null,
  setCurrentCapture: (path) => set({ currentCapture: path }),

  // Preferences
  preferences: null,
  loadPreferences: async () => {
    try {
      const preferences = await invoke<CapturePreferences>('get_preferences');
      set({ preferences });
    } catch (error) {
      console.error('Failed to load preferences:', error);
      set({ error: String(error) });
    }
  },
  updatePreferences: async (prefs: Partial<CapturePreferences>) => {
    try {
      const current = get().preferences;
      if (!current) return;
      const updated = { ...current, ...prefs };
      await invoke('set_preferences', { preferences: updated });
      set({ preferences: updated });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      set({ error: String(error) });
    }
  },

  // Sources
  screenSources: [],
  windowSources: [],
  loadScreenSources: async () => {
    try {
      const sources = await invoke<CaptureSource[]>('get_screen_sources');
      set({ screenSources: sources });
    } catch (error) {
      console.error('Failed to load screen sources:', error);
    }
  },
  loadWindowSources: async () => {
    try {
      const sources = await invoke<CaptureSource[]>('get_window_sources');
      set({ windowSources: sources });
    } catch (error) {
      console.error('Failed to load window sources:', error);
    }
  },

  // UI State
  isLoading: false,
  error: null,
  setError: (error) => set({ error }),
}));
