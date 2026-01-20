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
 * Create a platform-specific tray icon
 * - macOS: Uses template icon (16x16, black works with dark/light modes)
 * - Linux: Uses colored icon (22x22, visible on dark panels)
 * - Windows: Uses colored icon (16x16)
 */
function createTrayIcon(): Electron.NativeImage {
  // Determine icon filename based on platform
  // Linux/Windows: use colored trayIcon.png (visible on dark panels)
  // macOS: use icon.png (template-style works with system appearance)
  const iconFilename = process.platform === 'darwin' ? 'icon.png' : 'trayIcon.png';

  // Icon sizes per platform
  // Linux: 24x24 to match other system tray icons
  const iconSize = process.platform === 'darwin' ? 16 :
    process.platform === 'linux' ? 24 : 16;

  const possiblePaths = [
    // If running from dist/main/index.js -> ../../assets
    path.join(__dirname, '..', '..', 'assets', iconFilename),
    // If running from src/main/index.ts (ts-node) -> ../../../assets
    path.join(__dirname, '..', '..', '..', 'assets', iconFilename),
    // Absolute path fallback for dev
    path.join(process.cwd(), 'assets', iconFilename),
  ];

  for (const iconPath of possiblePaths) {
    captureLogger.debug(`Looking for tray icon at: ${iconPath}`);
    try {
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        captureLogger.info(`Found tray icon at: ${iconPath}, resizing to ${iconSize}x${iconSize}`);

        // Resize for platform-specific size
        const resizedIcon = icon.resize({ width: iconSize, height: iconSize });

        // On macOS, mark as template for proper dark/light mode handling
        if (process.platform === 'darwin') {
          resizedIcon.setTemplateImage(true);
        }

        return resizedIcon;
      }
    } catch (e) {
      // Ignore and try next path
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
