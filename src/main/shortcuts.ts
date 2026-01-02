/**
 * Global shortcuts registration
 * Per SPEC-0002: Menu Bar and Shortcuts - FR-2
 * @module main/shortcuts
 */

import { globalShortcut, app } from 'electron';
import { captureLogger } from '../shared/logger';
import { CapturePreferences } from '../shared/types';

export interface ShortcutActions {
  onCaptureFullScreen: () => void;
  onCaptureRegion: () => void;
  onCaptureWindow: () => void;
}

interface RegisteredShortcut {
  accelerator: string;
  action: () => void;
  description: string;
}

const registeredShortcuts: Map<string, RegisteredShortcut> = new Map();

/**
 * Register a single global shortcut
 */
function registerShortcut(
  accelerator: string, 
  action: () => void, 
  description: string
): boolean {
  try {
    // Check if already registered
    if (globalShortcut.isRegistered(accelerator)) {
      captureLogger.warn('Shortcut already registered', { accelerator, description });
      return false;
    }
    
    const success = globalShortcut.register(accelerator, () => {
      captureLogger.info('Shortcut triggered', { accelerator, description });
      action();
    });
    
    if (success) {
      registeredShortcuts.set(accelerator, { accelerator, action, description });
      captureLogger.info('Shortcut registered', { accelerator, description });
    } else {
      captureLogger.error('Failed to register shortcut', { accelerator, description });
    }
    
    return success;
  } catch (error) {
    captureLogger.error('Error registering shortcut', { 
      accelerator, 
      description,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Unregister a single global shortcut
 */
function unregisterShortcut(accelerator: string): void {
  try {
    if (globalShortcut.isRegistered(accelerator)) {
      globalShortcut.unregister(accelerator);
      registeredShortcuts.delete(accelerator);
      captureLogger.info('Shortcut unregistered', { accelerator });
    }
  } catch (error) {
    captureLogger.error('Error unregistering shortcut', { 
      accelerator,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Register all capture shortcuts
 * Per SPEC-0002 FR-2: Register global shortcuts that work when unfocused
 */
export function registerShortcuts(
  actions: ShortcutActions, 
  shortcuts: CapturePreferences['shortcuts']
): { success: boolean; failures: string[] } {
  captureLogger.info('Registering global shortcuts');
  
  const failures: string[] = [];
  
  // Full screen capture
  if (!registerShortcut(shortcuts.fullScreen, actions.onCaptureFullScreen, 'Capture Full Screen')) {
    failures.push(shortcuts.fullScreen);
  }
  
  // Region capture
  if (!registerShortcut(shortcuts.region, actions.onCaptureRegion, 'Capture Region')) {
    failures.push(shortcuts.region);
  }
  
  // Window capture
  if (!registerShortcut(shortcuts.window, actions.onCaptureWindow, 'Capture Window')) {
    failures.push(shortcuts.window);
  }
  
  const success = failures.length === 0;
  
  if (success) {
    captureLogger.info('All shortcuts registered successfully');
  } else {
    captureLogger.warn('Some shortcuts failed to register', { failures });
  }
  
  return { success, failures };
}

/**
 * Unregister all shortcuts
 * Per SPEC-0002 FR-2: Unregister on quit
 */
export function unregisterAllShortcuts(): void {
  captureLogger.info('Unregistering all global shortcuts');
  
  for (const [accelerator] of registeredShortcuts) {
    unregisterShortcut(accelerator);
  }
  
  globalShortcut.unregisterAll();
  registeredShortcuts.clear();
  
  captureLogger.info('All shortcuts unregistered');
}

/**
 * Update shortcuts (unregister old, register new)
 */
export function updateShortcuts(
  actions: ShortcutActions,
  newShortcuts: CapturePreferences['shortcuts']
): { success: boolean; failures: string[] } {
  captureLogger.info('Updating global shortcuts');
  
  unregisterAllShortcuts();
  return registerShortcuts(actions, newShortcuts);
}

/**
 * Check if shortcuts are registered
 */
export function areShortcutsRegistered(): boolean {
  return registeredShortcuts.size > 0;
}

/**
 * Get list of registered shortcuts
 */
export function getRegisteredShortcuts(): string[] {
  return Array.from(registeredShortcuts.keys());
}

/**
 * Setup app lifecycle handlers for shortcuts
 */
export function setupShortcutLifecycle(): void {
  // Unregister shortcuts when app is quitting
  app.on('will-quit', () => {
    captureLogger.info('App quitting, unregistering shortcuts');
    unregisterAllShortcuts();
  });
  
  // On macOS, re-register shortcuts when app becomes active after being suspended
  if (process.platform === 'darwin') {
    app.on('activate', () => {
      captureLogger.debug('App activated');
      // Shortcuts should persist, but we could re-register if needed
    });
  }
}
