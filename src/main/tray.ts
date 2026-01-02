/**
 * System tray/menu bar implementation
 * Per SPEC-0002: Menu Bar and Shortcuts
 * @module main/tray
 */

import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import * as path from 'path';
import { captureLogger } from '../shared/logger';

export interface TrayActions {
  onCaptureFullScreen: () => void;
  onCaptureRegion: () => void;
  onCaptureWindow: () => void;
  onOpenSettings: () => void;
}

let tray: Tray | null = null;

/**
 * Create a simple tray icon
 * For MVP, we create a simple icon programmatically
 */
function createTrayIcon(): Electron.NativeImage {
  // Create a simple 16x16 icon with a camera symbol
  // In production, this would load from assets/icon.png
  // For MVP, we create a basic programmatic icon
  
  // Try to load icon from assets directory first
  const iconPath = process.platform === 'darwin' 
    ? path.join(__dirname, '..', '..', 'assets', 'iconTemplate.png')
    : path.join(__dirname, '..', '..', 'assets', 'icon.png');
  
  try {
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      return icon;
    }
  } catch {
    // Fall through to create empty icon
  }
  
  // If icon file not found, create an empty icon
  // This will show as a small dot or default icon depending on OS
  captureLogger.warn('Tray icon not found, using default', { iconPath });
  return nativeImage.createEmpty();
}

/**
 * Build the context menu for the tray icon
 * Per SPEC-0002 Section 7: Menu items listed in order:
 * full screen, region, window, settings, quit
 */
function buildContextMenu(actions: TrayActions): Electron.Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Capture Full Screen',
      accelerator: 'CommandOrControl+Shift+1',
      click: () => {
        captureLogger.info('Menu action: Capture Full Screen');
        actions.onCaptureFullScreen();
      },
    },
    {
      label: 'Capture Region',
      accelerator: 'CommandOrControl+Shift+2',
      click: () => {
        captureLogger.info('Menu action: Capture Region');
        actions.onCaptureRegion();
      },
    },
    {
      label: 'Capture Window',
      accelerator: 'CommandOrControl+Shift+3',
      click: () => {
        captureLogger.info('Menu action: Capture Window');
        actions.onCaptureWindow();
      },
    },
    { type: 'separator' },
    {
      label: 'Settings...',
      click: () => {
        captureLogger.info('Menu action: Open Settings');
        actions.onOpenSettings();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Grab',
      accelerator: 'CommandOrControl+Q',
      click: () => {
        captureLogger.info('Menu action: Quit');
        app.quit();
      },
    },
  ]);
}

/**
 * Create and setup the system tray
 * Per SPEC-0002 FR-1: Create a tray/menu bar icon on startup
 */
export function createTray(actions: TrayActions): Tray {
  if (tray) {
    captureLogger.warn('Tray already exists, destroying and recreating');
    tray.destroy();
  }
  
  captureLogger.info('Creating system tray');
  
  const icon = createTrayIcon();
  tray = new Tray(icon);
  
  // Set tooltip
  tray.setToolTip('Grab - Screen Capture');
  
  // Set context menu
  const contextMenu = buildContextMenu(actions);
  tray.setContextMenu(contextMenu);
  
  // On macOS, clicking the tray icon shows the menu
  // On Windows/Linux, we might want different behavior
  if (process.platform === 'win32') {
    tray.on('click', () => {
      tray?.popUpContextMenu();
    });
  }
  
  captureLogger.info('System tray created successfully');
  return tray;
}

/**
 * Update the tray menu (e.g., after settings change)
 */
export function updateTrayMenu(actions: TrayActions): void {
  if (!tray) {
    captureLogger.warn('Cannot update tray menu: tray not created');
    return;
  }
  
  const contextMenu = buildContextMenu(actions);
  tray.setContextMenu(contextMenu);
  captureLogger.debug('Tray menu updated');
}

/**
 * Destroy the tray
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
    captureLogger.info('System tray destroyed');
  }
}

/**
 * Get the current tray instance
 */
export function getTray(): Tray | null {
  return tray;
}
