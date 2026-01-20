/**
 * Grab - Screen Capture Application
 * Main process entry point
 * Per SPEC-0001, SPEC-0002, SPEC-0003
 * @module main/index
 */

import { app, BrowserWindow, ipcMain, dialog, Notification, clipboard, nativeImage, shell, screen } from 'electron';
import * as fs from 'fs'; // Ensure fs is available for saving buffers



import * as path from 'path';
import { logger, captureLogger, exportLogger, LogLevel } from '../shared/logger';
import {
  CaptureRequest,
  CaptureMode,
  CapturePreferences,
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
import { showRegionSelector, setupRegionSelectionIPC, getCurrentDisplayId } from './regionOverlay';

// Keep a global reference of windows
let settingsWindow: BrowserWindow | null = null;
let regionOverlayWindow: BrowserWindow | null = null;
let windowPickerWindow: BrowserWindow | null = null;
let lastCapturedPath: string = '';

// Development mode flag
const isDev = process.env.NODE_ENV === 'development';

// Fix for Linux sandbox error
// On Linux, Electron's Chrome sandbox requires special SUID configuration which needs
// root privileges. For desktop applications, this is impractical, so we disable the sandbox.
// Security Note: Disabling the sandbox reduces isolation between processes. However, this is
// a common approach for Electron desktop apps on Linux. Users with properly configured SUID
// sandbox can set GRAB_ENABLE_SANDBOX=true to keep the sandbox enabled.
// See: https://www.electronjs.org/docs/latest/tutorial/sandbox
if (process.platform === 'linux' && process.env.GRAB_ENABLE_SANDBOX !== 'true') {
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
 * Open the settings window
 */
async function openSettingsWindow(): Promise<void> {
  // Reuse existing window or create new one
  if (!settingsWindow || settingsWindow.isDestroyed()) {
    settingsWindow = new BrowserWindow({
      width: 500,
      height: 600,
      title: 'Settings',
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // Load the settings HTML
    const htmlPath = isDev
      ? path.join(__dirname, '..', '..', 'src', 'renderer', 'settings.html')
      : path.join(__dirname, '..', 'renderer', 'settings.html');

    await settingsWindow.loadFile(htmlPath);

    settingsWindow.on('closed', () => {
      settingsWindow = null;
    });
  } else {
    settingsWindow.show();
    settingsWindow.focus();
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

    // Open Editor Window instead of just notification
    if (exportResult.filePath) {
      lastCapturedPath = exportResult.filePath;

      // Add to history
      getHistoryStore().add(exportResult.filePath);

      // Notify Editor window to refresh history if it's open
      if (windowPickerWindow && !windowPickerWindow.isDestroyed()) {
        windowPickerWindow.webContents.send('history:refresh');
      }

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
 * Shows display picker if multiple monitors detected
 */
async function handleCaptureFullScreen(): Promise<void> {
  const displays = screen.getAllDisplays();

  if (displays.length > 1) {
    // Multiple monitors - let user choose
    const displayLabels = displays.map((d, i) => {
      const isPrimary = d.id === screen.getPrimaryDisplay().id;
      return `Display ${i + 1}: ${d.size.width}x${d.size.height}${isPrimary ? ' (Primary)' : ''}`;
    });
    displayLabels.push('All Displays (Primary Only)');

    const result = await dialog.showMessageBox({
      type: 'question',
      title: 'Select Display',
      message: 'Which display do you want to capture?',
      buttons: displayLabels,
      cancelId: displayLabels.length - 1,
    });

    if (result.response < displays.length) {
      // Capture specific display
      const selectedDisplay = displays[result.response];
      await performCapture({
        mode: 'display',
        displayId: String(selectedDisplay.id)
      });
    } else {
      // Capture primary (default behavior)
      await performCapture({ mode: 'full-screen' });
    }
  } else {
    // Single monitor - capture directly
    await performCapture({ mode: 'full-screen' });
  }
}

/**
 * Handle region capture
 * Shows a transparent overlay for interactive click-and-drag region selection
 */
async function handleCaptureRegion(): Promise<void> {
  captureLogger.info('Region capture requested - showing selector overlay');

  const region = await showRegionSelector();

  if (region) {
    // Get the display ID from the overlay (the display where the selection was made)
    const displayId = getCurrentDisplayId();
    captureLogger.info('Region selected', { region, displayId });
    await performCapture({ mode: 'region', region, displayId: displayId || undefined });
  } else {
    captureLogger.info('Region selection cancelled');
  }
}

/**
 * Handle window capture
 * Shows a dialog to select which window to capture
 */
async function handleCaptureWindow(): Promise<void> {
  captureLogger.info('Window capture requested');

  try {
    const sources = await getWindowSources();

    if (sources.length === 0) {
      showNotification('No Windows', 'No capturable windows found');
      return;
    }

    // Show window selection dialog
    const windowNames = sources.map(s => s.name.substring(0, 50) + (s.name.length > 50 ? '...' : ''));
    windowNames.push('Cancel');

    const result = await dialog.showMessageBox({
      type: 'question',
      title: 'Select Window',
      message: 'Which window do you want to capture?',
      buttons: windowNames,
      cancelId: windowNames.length - 1,
    });

    if (result.response < sources.length) {
      const selectedWindow = sources[result.response];
      await performCapture({
        mode: 'window',
        windowId: selectedWindow.id,
      });
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    captureLogger.error('Window capture failed', { error: errorMsg });
    showNotification('Window Capture Failed', errorMsg);
  }
}

/**
 * Open settings window
 */
function handleOpenSettings(): void {
  captureLogger.info('Settings requested');
  openSettingsWindow();
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

  // Setup region selection IPC handlers
  setupRegionSelectionIPC();

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

  // Preferences: Get
  ipcMain.on(IPC_CHANNELS.PREFERENCES_GET, (event) => {
    const prefs = getPreferencesStore();
    event.sender.send(IPC_CHANNELS.PREFERENCES_RESULT, prefs.get());
  });

  // Preferences: Set
  ipcMain.on(IPC_CHANNELS.PREFERENCES_SET, (_event, newPrefs: CapturePreferences) => {
    const prefs = getPreferencesStore();
    prefs.set(newPrefs);
    captureLogger.info('Preferences updated', { newPrefs });
  });

  // Settings: Browse for folder
  ipcMain.on('settings:browse-folder', async (event) => {
    const prefs = getPreferencesStore();
    const result = await dialog.showOpenDialog({
      title: 'Select Output Folder',
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: prefs.getOutputFolder(),
    });

    if (!result.canceled && result.filePaths.length > 0) {
      event.sender.send('settings:folder-selected', result.filePaths[0]);
    }
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

  // Editor: Delete Screenshot
  ipcMain.on(IPC_CHANNELS.EDITOR_DELETE, async (event, filePath: string) => {
    if (!filePath) {
      event.sender.send('editor:delete:result', false);
      return;
    }

    try {
      // Move to trash instead of permanent delete (safer)
      await shell.trashItem(filePath);
      captureLogger.info('Screenshot deleted (moved to trash)', { filePath });

      // Remove from history
      getHistoryStore().remove(filePath);

      event.sender.send('editor:delete:result', true);
    } catch (error) {
      captureLogger.error('Failed to delete screenshot', { filePath, error });
      event.sender.send('editor:delete:result', false);
    }
  });

  // Editor: Capture actions (triggered from editor window)
  // Conditionally hide/minimize editor based on user preference
  ipcMain.on(IPC_CHANNELS.EDITOR_CAPTURE_FULLSCREEN, async () => {
    captureLogger.info('Capture Full Screen triggered from editor');

    const prefs = getPreferencesStore();
    const hideEditor = prefs.get().hideEditorDuringCapture ?? false;

    // Minimize editor if preference enabled
    if (hideEditor && windowPickerWindow && !windowPickerWindow.isDestroyed()) {
      windowPickerWindow.minimize();
    }

    await handleCaptureFullScreen();

    // Restore and refresh history
    if (windowPickerWindow && !windowPickerWindow.isDestroyed()) {
      if (hideEditor) {
        windowPickerWindow.restore();
      }
      windowPickerWindow.webContents.send('history:refresh');
    }
  });

  ipcMain.on(IPC_CHANNELS.EDITOR_CAPTURE_REGION, async () => {
    captureLogger.info('Capture Region triggered from editor');

    const prefs = getPreferencesStore();
    const hideEditor = prefs.get().hideEditorDuringCapture ?? false;

    // Hide editor if preference enabled (for region, hiding is recommended)
    if (hideEditor && windowPickerWindow && !windowPickerWindow.isDestroyed()) {
      windowPickerWindow.hide();
    }

    await handleCaptureRegion();

    // Show and refresh history
    if (windowPickerWindow && !windowPickerWindow.isDestroyed()) {
      if (hideEditor) {
        windowPickerWindow.show();
      }
      windowPickerWindow.webContents.send('history:refresh');
    }
  });

  ipcMain.on(IPC_CHANNELS.EDITOR_CAPTURE_WINDOW, async () => {
    captureLogger.info('Capture Window triggered from editor');

    const prefs = getPreferencesStore();
    const hideEditor = prefs.get().hideEditorDuringCapture ?? false;

    // Minimize editor if preference enabled
    if (hideEditor && windowPickerWindow && !windowPickerWindow.isDestroyed()) {
      windowPickerWindow.minimize();
    }

    await handleCaptureWindow();

    // Restore and refresh history
    if (windowPickerWindow && !windowPickerWindow.isDestroyed()) {
      if (hideEditor) {
        windowPickerWindow.restore();
      }
      windowPickerWindow.webContents.send('history:refresh');
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
