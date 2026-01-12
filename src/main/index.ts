/**
 * Grab - Screen Capture Application
 * Main process entry point
 * Per SPEC-0001, SPEC-0002, SPEC-0003
 * @module main/index
 */

import { app, BrowserWindow, ipcMain, dialog, Notification, clipboard, nativeImage, shell } from 'electron';
import * as fs from 'fs'; // Ensure fs is available for saving buffers



import * as path from 'path';
import { logger, captureLogger, exportLogger, LogLevel } from '../shared/logger';
import {
  CaptureRequest,
  CaptureMode,
} from '../shared/types';
import { IPC_CHANNELS } from '../shared/constants';
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
import { getHistoryStore } from './history';

// Keep a global reference of windows
let settingsWindow: BrowserWindow | null = null;
let regionOverlayWindow: BrowserWindow | null = null;
let windowPickerWindow: BrowserWindow | null = null;
let lastCapturedPath: string = '';

// Development mode flag
const isDev = process.env.NODE_ENV === 'development';

// Fix for Linux sandbox error
// On Linux, disable Chrome sandbox to avoid SUID sandbox configuration issues
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
}

/**
 * Show a notification
 */
function showNotification(title: string, body: string): void {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
}

/**
 * Open the editor window with the captured image
 */
async function openEditorWindow(filePath: string): Promise<void> {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }

  // Reuse existing window or create new one
  if (!windowPickerWindow || windowPickerWindow.isDestroyed()) {
    windowPickerWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      title: 'Grab Editor',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // Load the renderer HTML
    // Handle dev vs prod paths
    const htmlPath = isDev
      ? path.join(__dirname, '..', '..', 'src', 'renderer', 'index.html')
      : path.join(__dirname, '..', 'renderer', 'index.html');

    await windowPickerWindow.loadFile(htmlPath);

    windowPickerWindow.on('closed', () => {
      windowPickerWindow = null;
    });
  } else {
    windowPickerWindow.show();
    windowPickerWindow.focus();
  }

  // Send file path to renderer
  // Wait a bit for window to load if it was just created
  setTimeout(() => {
    windowPickerWindow?.webContents.send(IPC_CHANNELS.SHOW_CAPTURE, filePath);
  }, 500);
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

    // Open Editor Window instead of just notification
    if (exportResult.filePath) {
      lastCapturedPath = exportResult.filePath;

      // Add to history
      getHistoryStore().add(exportResult.filePath);

      if (preferences.openEditorAfterCapture) {
        await openEditorWindow(exportResult.filePath);
      } else {
        // Show notification with action to open (if supported) or just info
        // For MVP, just show text, user can click tray to open logic
        showNotification(
          'Capture Complete',
          `Saved to ${path.basename(exportResult.filePath)}\nClick 'Open Editor' in menu to view.`
        );
      }

      // Still show notification if just copied or if desired
      let message = `Captured to ${path.basename(exportResult.filePath)}`;
      if (exportResult.copiedToClipboard) {
        message += ' and clipboard';
      }
    }

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
    onOpenEditor: () => {
      captureLogger.info('Opening editor manually');
      // We need the last captured file or just open the window empty/with placeholder
      // For now, we'll open it. If we have a last capture in memory, we could pass it.
      // Or we just open the window and let it check for state.

      // Let's rely on the module variable currentFilePath if we had one (we need to track it)
      // For MVP, just open the window.

      // We'll create a simple function to just open
      // Try to get latest from history if lastCapturedPath is empty
      let targetPath = lastCapturedPath;
      if (!targetPath) {
        const latest = getHistoryStore().getLatest();
        if (latest) {
          targetPath = latest.filePath;
        }
      }

      openEditorWindow(targetPath);
    }
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

  // Handle history requests
  ipcMain.on(IPC_CHANNELS.HISTORY_GET, (event) => {
    // Refresh/Scan before returning to ensure it's up to date
    const prefs = getPreferencesStore();
    getHistoryStore().scanDirectory(prefs.getOutputFolder());

    const history = getHistoryStore().getAll();
    event.sender.send(IPC_CHANNELS.HISTORY_RESULT, history);
  });

  // Editor: Copy Image
  ipcMain.on(IPC_CHANNELS.EDITOR_COPY, async (event, data: string) => {
    if (!data) return;
    try {
      let image;
      if (data.startsWith('data:')) {
        image = nativeImage.createFromDataURL(data);
      } else {
        image = nativeImage.createFromPath(data);
      }
      clipboard.writeImage(image);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  });

  // Editor: Save As
  ipcMain.on(IPC_CHANNELS.EDITOR_SAVE, async (event, data: string) => {
    if (!data) return;
    try {
      let defaultPath = 'capture.png';
      let buffer: Buffer | null = null;

      if (data.startsWith('data:')) {
        const image = nativeImage.createFromDataURL(data);
        buffer = image.toPNG();
      } else {
        defaultPath = data;
      }

      const { canceled, filePath: destPath } = await dialog.showSaveDialog({
        defaultPath: defaultPath,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
      });

      if (!canceled && destPath) {
        if (buffer) {
          await fs.promises.writeFile(destPath, buffer);
        } else {
          await fs.promises.copyFile(data, destPath);
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  });

  // Editor: Reveal in Finder
  ipcMain.on(IPC_CHANNELS.EDITOR_REVEAL, (event, filePath: string) => {
    if (filePath) {
      shell.showItemInFolder(filePath);
    }
  });

  // Initial scan in background
  setTimeout(() => {
    const prefs = getPreferencesStore();
    getHistoryStore().scanDirectory(prefs.getOutputFolder());
  }, 1000);

  // Show startup notification
  const modifier = process.platform === 'darwin' ? 'Cmd' : 'Ctrl';
  showNotification(
    'Grab Ready',
    `Running in background.\nPress ${modifier}+Shift+1 for Full Screen Capture.`
  );
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
