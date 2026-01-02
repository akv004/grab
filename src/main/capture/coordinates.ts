/**
 * Coordinate normalization utilities
 * Per SPEC-0003 Section 11: Multi-display with different scale factors
 * @module main/capture/coordinates
 */

import { screen, Display } from 'electron';
import { RegionBounds } from '../../shared/types';

/**
 * Get all displays with their bounds and scale factors
 */
export function getAllDisplays(): Display[] {
  return screen.getAllDisplays();
}

/**
 * Get primary display
 */
export function getPrimaryDisplay(): Display {
  return screen.getPrimaryDisplay();
}

/**
 * Get display by ID
 */
export function getDisplayById(displayId: string): Display | undefined {
  const displays = getAllDisplays();
  return displays.find(d => String(d.id) === displayId);
}

/**
 * Get the display containing the given point
 */
export function getDisplayForPoint(x: number, y: number): Display {
  return screen.getDisplayNearestPoint({ x, y });
}

/**
 * Get combined bounds of all displays (virtual screen)
 */
export function getVirtualScreenBounds(): RegionBounds {
  const displays = getAllDisplays();
  
  if (displays.length === 0) {
    const primary = getPrimaryDisplay();
    return {
      x: 0,
      y: 0,
      width: primary.bounds.width,
      height: primary.bounds.height,
    };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const display of displays) {
    const { x, y, width, height } = display.bounds;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Normalize bounds from screen coordinates to image coordinates
 * considering scale factor
 */
export function normalizeToImageCoords(
  bounds: RegionBounds,
  scaleFactor: number
): RegionBounds {
  return {
    x: Math.round(bounds.x * scaleFactor),
    y: Math.round(bounds.y * scaleFactor),
    width: Math.round(bounds.width * scaleFactor),
    height: Math.round(bounds.height * scaleFactor),
  };
}

/**
 * Normalize bounds from image coordinates to screen coordinates
 */
export function normalizeToScreenCoords(
  bounds: RegionBounds,
  scaleFactor: number
): RegionBounds {
  return {
    x: Math.round(bounds.x / scaleFactor),
    y: Math.round(bounds.y / scaleFactor),
    width: Math.round(bounds.width / scaleFactor),
    height: Math.round(bounds.height / scaleFactor),
  };
}

/**
 * Get scale factor for a specific display
 */
export function getScaleFactorForDisplay(displayId?: string): number {
  if (displayId) {
    const display = getDisplayById(displayId);
    if (display) {
      return display.scaleFactor;
    }
  }
  return getPrimaryDisplay().scaleFactor;
}

/**
 * Validate and clamp region bounds within display bounds
 */
export function clampRegionToDisplay(
  region: RegionBounds,
  displayBounds: RegionBounds
): RegionBounds {
  const x = Math.max(displayBounds.x, Math.min(region.x, displayBounds.x + displayBounds.width));
  const y = Math.max(displayBounds.y, Math.min(region.y, displayBounds.y + displayBounds.height));
  const width = Math.min(region.width, displayBounds.x + displayBounds.width - x);
  const height = Math.min(region.height, displayBounds.y + displayBounds.height - y);
  
  return { x, y, width, height };
}

/**
 * Check if a region is valid (has positive dimensions)
 */
export function isValidRegion(region: RegionBounds): boolean {
  return region.width > 0 && region.height > 0;
}
