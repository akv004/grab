/**
 * Grab - Screen Capture Application
 * Main process entry point
 * Per SPEC-0001, SPEC-0002, SPEC-0003
 * @module main/index
 */

import { app, BrowserWindow, ipcMain, dialog, Notification } from 'electron';
import * as path from 'path';
import { logger, captureLogger, exportLogger, LogLevel } from '../shared/logger';
import { 
  CaptureRequest, 
  CaptureMode,
  IPC_CHANNELS,
  CaptureErrorCode,
  DEFAULT_PREFERENCES,
} from '../shared/types';
import { 
  capture, 
  getScreenSources, 
  getWindowSources,
  createCaptureError,
} from './capture';
import { exportCapture } from './export';
import { getPreferencesStore } from './preferences';
import { createTray, destroyTray, TrayActions } from './tray';
import { 
  registerShortcuts, 
  unregisterAllShortcuts, 
  setupShortcutLifecycle,
  ShortcutActions,
} from './shortcuts';

// Keep a global reference of windows
let settingsWindow: BrowserWindow | null = null;
let regionOverlayWindow: BrowserWindow | null = null;
let windowPickerWindow: BrowserWindow | null = null;

// Development mode flag
const isDev = process.env.NODE_ENV === 'development';

/**
 * Show a notification
 */
function showNotification(title: string, body: string): void {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
}

/**
 * Perform a capture and export
 */
async function performCapture(request: CaptureRequest): Promise<void> {
  const prefs = getPreferencesStore();
  const preferences = prefs.get();
  
  captureLogger.info('Performing capture', { mode: request.mode });
  
  try {
    // Merge request with default preferences
    const fullRequest: CaptureRequest = {
      ...request,
      copyToClipboard: request.copyToClipboard ?? preferences.copyToClipboard,
      saveToDisk: request.saveToDisk ?? preferences.saveToDisk,
    };
    
    // Capture
    const { image, metadata } = await capture(fullRequest);
    
    // Export
    const exportResult = await exportCapture(image, metadata, {
      saveToDisk: fullRequest.saveToDisk ?? true,
      copyToClipboard: fullRequest.copyToClipboard ?? true,
      outputFolder: preferences.outputFolder,
    });
    
    // Show success notification
    let message = '';
    if (exportResult.filePath) {
      message += `Saved to ${path.basename(exportResult.filePath)}`;
    }
    if (exportResult.copiedToClipboard) {
      message += message ? ' and copied to clipboard' : 'Copied to clipboard';
    }
    showNotification('Capture Complete', message);
    
    captureLogger.info('Capture and export complete', { 
      filePath: exportResult.filePath,
      copiedToClipboard: exportResult.copiedToClipboard,
    });
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    captureLogger.error('Capture failed', { error: errorMsg });
    showNotification('Capture Failed', errorMsg);
  }
}

/**
 * Handle full screen capture
 */
async function handleCaptureFullScreen(): Promise<void> {
  await performCapture({ mode: 'full-screen' });
}

/**
 * Handle region capture
 * For MVP, we notify the user that region selection is not yet available
 * and capture full screen as a fallback
 * Full region overlay will be implemented in next iteration
 */
async function handleCaptureRegion(): Promise<void> {
  // For MVP, inform user and capture full screen as fallback
  // TODO: Implement region selection overlay (TASK-0007 step 3)
  captureLogger.info('Region capture requested - using full screen for MVP');
  
  // Show notification that region selection is coming
  showNotification(
    'Region Capture', 
    'Region selection will be available in the next update. Capturing full screen instead.'
  );
  
  await performCapture({ mode: 'full-screen' });
}

/**
 * Handle window capture
 * For MVP, we'll show a simple dialog to select window
 */
async function handleCaptureWindow(): Promise<void> {
  captureLogger.info('Window capture requested');
  
  try {
    const sources = await getWindowSources();
    
    if (sources.length === 0) {
      showNotification('No Windows', 'No capturable windows found');
      return;
    }
    
    // For MVP, capture the first available window
    // TODO: Implement window picker UI (TASK-0007 step 2)
    const firstWindow = sources[0];
    
    await performCapture({ 
      mode: 'window', 
      windowId: firstWindow.id,
    });
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    captureLogger.error('Window capture failed', { error: errorMsg });
    showNotification('Window Capture Failed', errorMsg);
  }
}

/**
 * Open settings window
 * For MVP, just show dialog about settings
 */
function handleOpenSettings(): void {
  captureLogger.info('Settings requested');
  
  // For MVP, show a simple dialog
  // TODO: Implement full settings window (TASK-0006)
  const prefs = getPreferencesStore();
  const preferences = prefs.get();
  
  dialog.showMessageBox({
    type: 'info',
    title: 'Grab Settings',
    message: 'Settings',
    detail: `Output folder: ${preferences.outputFolder}\n\nFull settings window coming soon!`,
    buttons: ['OK', 'Change Output Folder'],
  }).then((result) => {
    if (result.response === 1) {
      // Change output folder
      dialog.showOpenDialog({
        title: 'Select Output Folder',
        properties: ['openDirectory', 'createDirectory'],
        defaultPath: preferences.outputFolder,
      }).then((folderResult) => {
        if (!folderResult.canceled && folderResult.filePaths.length > 0) {
          prefs.setOutputFolder(folderResult.filePaths[0]);
          showNotification('Settings Updated', `Output folder: ${folderResult.filePaths[0]}`);
        }
      });
    }
  });
}

/**
 * Initialize the application
 */
async function initialize(): Promise<void> {
  captureLogger.info('Initializing Grab application');
  
  // Set log level based on environment
  if (isDev) {
    logger.setLevel(LogLevel.DEBUG);
  }
  
  // Initialize preferences
  const prefs = getPreferencesStore();
  const preferences = prefs.get();
  captureLogger.info('Preferences loaded', { outputFolder: preferences.outputFolder });
  
  // Setup tray actions
  const trayActions: TrayActions = {
    onCaptureFullScreen: handleCaptureFullScreen,
    onCaptureRegion: handleCaptureRegion,
    onCaptureWindow: handleCaptureWindow,
    onOpenSettings: handleOpenSettings,
  };
  
  // Create system tray
  createTray(trayActions);
  
  // Setup shortcut actions
  const shortcutActions: ShortcutActions = {
    onCaptureFullScreen: handleCaptureFullScreen,
    onCaptureRegion: handleCaptureRegion,
    onCaptureWindow: handleCaptureWindow,
  };
  
  // Register global shortcuts
  setupShortcutLifecycle();
  const shortcutResult = registerShortcuts(shortcutActions, preferences.shortcuts);
  
  if (!shortcutResult.success) {
    captureLogger.warn('Some shortcuts failed to register', { 
      failures: shortcutResult.failures 
    });
  }
  
  // Hide dock icon on macOS (we're a menu bar app)
  if (process.platform === 'darwin') {
    app.dock?.hide();
  }
  
  captureLogger.info('Grab application initialized');
}

/**
 * Application ready handler
 */
app.whenReady().then(async () => {
  captureLogger.info('Electron app ready');
  
  await initialize();
  
  // Re-create tray on activate (macOS)
  app.on('activate', () => {
    captureLogger.debug('App activated');
  });
});

/**
 * Quit when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until user quits explicitly
  // But since we're a menu bar app, we don't need to quit
  captureLogger.debug('All windows closed');
});

/**
 * Cleanup on quit
 */
app.on('will-quit', () => {
  captureLogger.info('Application quitting');
  destroyTray();
  unregisterAllShortcuts();
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  captureLogger.error('Uncaught exception', { 
    error: error.message,
    stack: error.stack,
  });
});

process.on('unhandledRejection', (reason) => {
  captureLogger.error('Unhandled rejection', { 
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});
