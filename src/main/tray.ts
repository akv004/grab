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
  onOpenEditor: () => void;
  onOpenSettings: () => void;
}

let tray: Tray | null = null;

/**
 * Create a simple tray icon
 * For MVP, we create a simple icon programmatically
 */
function createTrayIcon(): Electron.NativeImage {
  // Try to load icon from assets directory
  // We need to handle both dev (src/main/...) and prod (dist/main/...) paths
  // The 'assets' folder is in the project root

  const possiblePaths = [
    // If running from dist/main/index.js -> ../../assets
    path.join(__dirname, '..', '..', 'assets', 'iconTemplate.png'),
    // If running from src/main/index.ts (ts-node) -> ../../../assets
    path.join(__dirname, '..', '..', '..', 'assets', 'iconTemplate.png'),
    // Absolute path fallback for dev
    path.join(process.cwd(), 'assets', 'iconTemplate.png'),
  ];

  if (process.platform !== 'darwin') {
    possiblePaths.push(path.join(__dirname, '..', '..', 'assets', 'icon.png'));
  }

  for (const iconPath of possiblePaths) {
    captureLogger.debug(`Looking for tray icon at: ${iconPath}`);
    try {
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        captureLogger.info(`Found tray icon at: ${iconPath}`);

        // Resize for macOS menu bar (usually 16x16 or 22x22 points)
        if (process.platform === 'darwin') {
          return icon.resize({ width: 16, height: 16 });
        }
        return icon;
      }
    } catch (e) {
      // Ignore
    }
  }

  // If icon file not found, create an empty icon
  captureLogger.warn('Tray icon not found in any expected location');
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
      label: 'Open Editor',
      click: () => {
        captureLogger.info('Menu action: Open Editor');
        actions.onOpenEditor();
      },
    },
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
