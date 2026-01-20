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
let currentDisplayId: string | null = null; // Track which display the overlay is on

// Development mode flag
const isDev = process.env.NODE_ENV === 'development';

/**
 * Get the bounds of the entire virtual screen (all displays combined)
 * This allows the overlay to span all monitors like Snagit
 */
function getVirtualScreenBounds(): { x: number; y: number; width: number; height: number } {
    const displays = screen.getAllDisplays();

    // Calculate the bounding rectangle that contains all displays
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const display of displays) {
        minX = Math.min(minX, display.bounds.x);
        minY = Math.min(minY, display.bounds.y);
        maxX = Math.max(maxX, display.bounds.x + display.bounds.width);
        maxY = Math.max(maxY, display.bounds.y + display.bounds.height);
    }

    const bounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };

    captureLogger.info('Virtual screen bounds calculated', {
        displays: displays.map(d => ({ id: d.id, bounds: d.bounds })),
        virtualBounds: bounds,
    });

    return bounds;
}

/**
 * Find which display contains a given point
 */
function getDisplayAtPoint(x: number, y: number): Electron.Display {
    return screen.getDisplayNearestPoint({ x, y });
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

    // Get virtual screen bounds (spans all displays)
    const bounds = getVirtualScreenBounds();
    captureLogger.debug('Virtual screen bounds for overlay', bounds);

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

        // Explicitly set bounds to ensure correct positioning on Linux
        // Some window managers may not respect initial x,y coordinates
        overlayWindow.setBounds({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
        });

        captureLogger.debug('Overlay window bounds set', {
            requested: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
            actual: overlayWindow.getBounds(),
        });

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
                scaleFactor: 1, // Default scale factor for virtual screen
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
 * Get the display ID that was used for the most recent region selection
 */
export function getCurrentDisplayId(): string | null {
    return currentDisplayId;
}

/**
 * Setup IPC handlers for region selection events
 * Should be called once during app initialization
 */
export function setupRegionSelectionIPC(): void {
    // Handle region selection complete
    ipcMain.on(IPC_CHANNELS.REGION_SELECT_DONE, (_event, region: RegionBounds) => {
        // The region has absolute screen coordinates from the virtual screen overlay
        // We need to find which display it's in and convert to display-relative coordinates

        // Get the virtual screen bounds (used for the overlay positioning)
        const virtualBounds = getVirtualScreenBounds();

        // The selection coordinates are relative to the overlay window, which starts at virtualBounds.x/y
        // Convert to absolute screen coordinates
        const absX = virtualBounds.x + region.x;
        const absY = virtualBounds.y + region.y;

        // Find which display contains the center of the selection
        const centerX = absX + region.width / 2;
        const centerY = absY + region.height / 2;
        const display = getDisplayAtPoint(centerX, centerY);

        // Store the display ID
        currentDisplayId = String(display.id);

        // Convert to display-relative coordinates for cropping
        const relativeRegion: RegionBounds = {
            x: absX - display.bounds.x,
            y: absY - display.bounds.y,
            width: region.width,
            height: region.height,
        };

        captureLogger.info('Region selected', {
            originalRegion: region,
            absCoords: { x: absX, y: absY },
            display: { id: display.id, bounds: display.bounds },
            relativeRegion,
        });

        if (selectionResolver) {
            selectionResolver(relativeRegion);
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
