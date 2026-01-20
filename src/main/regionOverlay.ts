/**
 * Region Selection Overlay Manager
 * Creates a transparent fullscreen overlay for interactive region selection
 * @module main/regionOverlay
 */

import { BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import { IPC_CHANNELS } from '../shared/constants';
import { RegionBounds } from '../shared/types';
import { captureLogger } from '../shared/logger';

let overlayWindow: BrowserWindow | null = null;
let selectionResolver: ((region: RegionBounds | null) => void) | null = null;

// Development mode flag
const isDev = process.env.NODE_ENV === 'development';

/**
 * Get the primary display bounds (for single monitor support initially)
 * Using primary display to avoid coordinate complexity
 */
function getPrimaryDisplayBounds(): { x: number; y: number; width: number; height: number; scaleFactor: number } {
    const primaryDisplay = screen.getPrimaryDisplay();
    return {
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y,
        width: primaryDisplay.bounds.width,
        height: primaryDisplay.bounds.height,
        scaleFactor: primaryDisplay.scaleFactor,
    };
}

/**
 * Show the region selection overlay
 * Returns a Promise that resolves with the selected region bounds, or null if cancelled
 */
export async function showRegionSelector(): Promise<RegionBounds | null> {
    captureLogger.info('Showing region selection overlay');

    // Close any existing overlay
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.close();
        overlayWindow = null;
    }

    // Get primary display bounds
    const bounds = getPrimaryDisplayBounds();
    captureLogger.debug('Display bounds for overlay', bounds);

    return new Promise((resolve) => {
        selectionResolver = resolve;

        // Create transparent fullscreen overlay window
        // Key: Use simpler approach without screen buffer to avoid blur/flicker
        overlayWindow = new BrowserWindow({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false,
            movable: false,
            minimizable: false,
            maximizable: false,
            fullscreenable: false,
            focusable: true,
            hasShadow: false,
            // Disable hardware acceleration to prevent visual artifacts
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                // Disable zoom to ensure 1:1 pixel mapping
                zoomFactor: 1,
            },
        });

        // Prevent any flickering by setting background color
        overlayWindow.setBackgroundColor('#00000000');

        // Load the overlay HTML
        const htmlPath = isDev
            ? path.join(__dirname, '..', '..', 'src', 'renderer', 'overlay.html')
            : path.join(__dirname, '..', 'renderer', 'overlay.html');

        overlayWindow.loadFile(htmlPath);

        // Send display info to renderer for proper coordinate handling
        overlayWindow.webContents.on('did-finish-load', () => {
            overlayWindow?.webContents.send('display-info', {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                scaleFactor: bounds.scaleFactor,
            });
        });

        // Handle window close
        overlayWindow.on('closed', () => {
            overlayWindow = null;
            // If resolver still exists, selection was cancelled
            if (selectionResolver) {
                selectionResolver(null);
                selectionResolver = null;
            }
        });

        captureLogger.debug('Region overlay window created');
    });
}

/**
 * Close the region selector overlay
 */
export function closeRegionSelector(): void {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.close();
        overlayWindow = null;
    }
}

/**
 * Setup IPC handlers for region selection events
 * Should be called once during app initialization
 */
export function setupRegionSelectionIPC(): void {
    // Handle region selection complete
    ipcMain.on(IPC_CHANNELS.REGION_SELECT_DONE, (_event, region: RegionBounds) => {
        captureLogger.info('Region selected', { region });

        if (selectionResolver) {
            selectionResolver(region);
            selectionResolver = null;
        }

        closeRegionSelector();
    });

    // Handle region selection cancelled
    ipcMain.on(IPC_CHANNELS.REGION_SELECT_CANCEL, () => {
        captureLogger.info('Region selection cancelled');

        if (selectionResolver) {
            selectionResolver(null);
            selectionResolver = null;
        }

        closeRegionSelector();
    });

    captureLogger.debug('Region selection IPC handlers registered');
}
