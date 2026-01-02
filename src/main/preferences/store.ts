/**
 * Preferences store for persisting user settings
 * Per SPEC-0002 Section 9 and SPEC-0003 Section 9
 * @module main/preferences/store
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { CapturePreferences, DEFAULT_PREFERENCES } from '../../shared/types';
import { preferencesLogger } from '../../shared/logger';

const PREFERENCES_FILE = 'preferences.json';

class PreferencesStore {
  private preferences: CapturePreferences;
  private filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath('userData'), PREFERENCES_FILE);
    this.preferences = this.load();
  }

  private getDefaultOutputFolder(): string {
    // Per SPEC-0003 Section 16: Default output folder per OS
    const platform = process.platform;
    const pictures = app.getPath('pictures');
    
    switch (platform) {
      case 'darwin':
        return path.join(pictures, 'Grab');
      case 'win32':
        return path.join(pictures, 'Grab');
      default:
        return path.join(app.getPath('home'), 'Pictures', 'Grab');
    }
  }

  private load(): CapturePreferences {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(data) as Partial<CapturePreferences>;
        
        // Merge with defaults to ensure all fields exist
        const merged = { ...DEFAULT_PREFERENCES, ...parsed };
        
        // Set default output folder if not set
        if (!merged.outputFolder) {
          merged.outputFolder = this.getDefaultOutputFolder();
        }
        
        preferencesLogger.info('Preferences loaded', { path: this.filePath });
        return merged;
      }
    } catch (error) {
      preferencesLogger.error('Failed to load preferences', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
    
    // Return defaults with platform-specific output folder
    const defaults = { ...DEFAULT_PREFERENCES };
    defaults.outputFolder = this.getDefaultOutputFolder();
    return defaults;
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.filePath, JSON.stringify(this.preferences, null, 2), 'utf-8');
      preferencesLogger.info('Preferences saved', { path: this.filePath });
    } catch (error) {
      preferencesLogger.error('Failed to save preferences', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  get(): CapturePreferences {
    return { ...this.preferences };
  }

  set(updates: Partial<CapturePreferences>): CapturePreferences {
    this.preferences = { ...this.preferences, ...updates };
    this.save();
    return this.get();
  }

  getOutputFolder(): string {
    return this.preferences.outputFolder;
  }

  setOutputFolder(folder: string): void {
    this.set({ outputFolder: folder });
  }

  shouldCopyToClipboard(): boolean {
    return this.preferences.copyToClipboard;
  }

  shouldSaveToDisk(): boolean {
    return this.preferences.saveToDisk;
  }

  getShortcuts(): CapturePreferences['shortcuts'] {
    return { ...this.preferences.shortcuts };
  }

  setShortcuts(shortcuts: Partial<CapturePreferences['shortcuts']>): void {
    this.set({ 
      shortcuts: { ...this.preferences.shortcuts, ...shortcuts } 
    });
  }

  reset(): CapturePreferences {
    this.preferences = { 
      ...DEFAULT_PREFERENCES,
      outputFolder: this.getDefaultOutputFolder(),
    };
    this.save();
    return this.get();
  }
}

// Singleton instance
let instance: PreferencesStore | null = null;

export function getPreferencesStore(): PreferencesStore {
  if (!instance) {
    instance = new PreferencesStore();
  }
  return instance;
}

export { PreferencesStore };
