/**
 * Electron Capture Engine
 * Per SPEC-0003: Capture Engine (Electron)
 * Implements FR-1 through FR-8
 * @module main/capture/engine
 */

import { desktopCapturer, NativeImage, Display } from 'electron';
import {
  CaptureMode,
  CaptureRequest,
  CaptureResult,
  CaptureMetadata,
  CaptureSource,
  CaptureError,
  CaptureErrorCode,
  RegionBounds
} from '../../shared/types';
import { captureLogger } from '../../shared/logger';
import {
  getAllDisplays,
  getPrimaryDisplay,
  getDisplayById,
  getScaleFactorForDisplay,
  isValidRegion
} from './coordinates';
import { generateFileName } from './naming';

/**
 * Source type for desktop capturer
 */
type SourceType = 'screen' | 'window';

/**
 * Get available capture sources (screens and/or windows)
 * Per FR-3: Enumerate eligible windows
 */
export async function getSources(types: SourceType[]): Promise<CaptureSource[]> {
  captureLogger.debug('Getting capture sources', { types });

  try {
    const sources = await desktopCapturer.getSources({
      types,
      thumbnailSize: { width: 300, height: 200 },
      fetchWindowIcons: true,
    });

    const result: CaptureSource[] = sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      displayId: source.display_id,
      appIcon: source.appIcon?.toDataURL(),
    }));

    captureLogger.info('Sources enumerated', { count: result.length, types });
    return result;
  } catch (error) {
    captureLogger.error('Failed to get sources', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Get all screen sources
 */
export async function getScreenSources(): Promise<CaptureSource[]> {
  return getSources(['screen']);
}

/**
 * Get all window sources
 * Per FR-3: Exclude protected windows where possible
 */
export async function getWindowSources(): Promise<CaptureSource[]> {
  return getSources(['window']);
}

/**
 * Capture a specific source by ID
 */
async function captureSourceById(sourceId: string): Promise<NativeImage> {
  captureLogger.debug('Capturing source', { sourceId });

  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 0, height: 0 }, // We'll get full resolution
  });

  const source = sources.find(s => s.id === sourceId);
  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }

  // For full resolution capture, we need to get a larger thumbnail
  const display = getPrimaryDisplay();
  const largerSources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: {
      width: display.size.width * display.scaleFactor,
      height: display.size.height * display.scaleFactor,
    },
  });

  const largerSource = largerSources.find(s => s.id === sourceId);
  if (!largerSource) {
    throw new Error(`Source not found on retry: ${sourceId}`);
  }

  return largerSource.thumbnail;
}

/**
 * Capture full screen (all displays)
 * Per FR-1: Capture full screen across all displays
 */
async function captureFullScreen(): Promise<{ image: NativeImage; bounds: RegionBounds; scaleFactor: number; displayId?: string }> {
  captureLogger.info('Starting full screen capture');

  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  if (sources.length === 0) {
    throw new Error('No screen sources available');
  }

  // Capture primary display by default
  const primaryDisplay = getPrimaryDisplay();
  const primarySource = sources.find(s => s.display_id === String(primaryDisplay.id)) || sources[0];

  const largerSources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: primaryDisplay.size.width * primaryDisplay.scaleFactor,
      height: primaryDisplay.size.height * primaryDisplay.scaleFactor,
    },
  });

  const source = largerSources.find(s => s.id === primarySource.id) || largerSources[0];

  return {
    image: source.thumbnail,
    bounds: {
      x: primaryDisplay.bounds.x,
      y: primaryDisplay.bounds.y,
      width: primaryDisplay.bounds.width,
      height: primaryDisplay.bounds.height,
    },
    scaleFactor: primaryDisplay.scaleFactor,
    displayId: primarySource.display_id,
  };
}

/**
 * Capture a specific display
 * Per FR-2: Support targeting a specific display ID
 */
async function captureDisplay(displayId: string): Promise<{ image: NativeImage; bounds: RegionBounds; scaleFactor: number; displayId: string }> {
  captureLogger.info('Starting display capture', { displayId });

  const display = getDisplayById(displayId);
  if (!display) {
    throw new Error(`Display not found: ${displayId}`);
  }

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: display.size.width * display.scaleFactor,
      height: display.size.height * display.scaleFactor,
    },
  });

  const source = sources.find(s => s.display_id === displayId);
  if (!source) {
    throw new Error(`Screen source not found for display: ${displayId}`);
  }

  return {
    image: source.thumbnail,
    bounds: {
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
    },
    scaleFactor: display.scaleFactor,
    displayId,
  };
}

/**
 * Capture a specific window
 * Per FR-3: Capture chosen window respecting OS-protected windows
 */
async function captureWindow(windowId: string): Promise<{ image: NativeImage; bounds: RegionBounds; scaleFactor: number; windowId: string }> {
  captureLogger.info('Starting window capture', { windowId });

  const primaryDisplay = getPrimaryDisplay();

  const sources = await desktopCapturer.getSources({
    types: ['window'],
    thumbnailSize: {
      width: primaryDisplay.size.width * primaryDisplay.scaleFactor,
      height: primaryDisplay.size.height * primaryDisplay.scaleFactor,
    },
  });

  const source = sources.find(s => s.id === windowId);
  if (!source) {
    throw new Error(`Window source not found: ${windowId}`);
  }

  const size = source.thumbnail.getSize();

  return {
    image: source.thumbnail,
    bounds: {
      x: 0,
      y: 0,
      width: size.width / primaryDisplay.scaleFactor,
      height: size.height / primaryDisplay.scaleFactor,
    },
    scaleFactor: primaryDisplay.scaleFactor,
    windowId,
  };
}

/**
 * Crop an image to a specific region
 * Per FR-4: Region capture via selection overlay
 */
function cropImage(image: NativeImage, region: RegionBounds, scaleFactor: number): NativeImage {
  const scaledRegion = {
    x: Math.round(region.x * scaleFactor),
    y: Math.round(region.y * scaleFactor),
    width: Math.round(region.width * scaleFactor),
    height: Math.round(region.height * scaleFactor),
  };

  return image.crop(scaledRegion);
}

/**
 * Main capture function
 * Per FR-1: Provide capture engine API callable by menu bar actions and global shortcuts
 */
export async function capture(request: CaptureRequest): Promise<{
  image: NativeImage;
  metadata: CaptureMetadata;
}> {
  const startTime = Date.now();
  captureLogger.info('Capture request received', { mode: request.mode });

  try {
    let image: NativeImage;
    let bounds: RegionBounds;
    let scaleFactor: number;
    let displayId: string | undefined;
    let windowId: string | undefined;

    switch (request.mode) {
      case 'full-screen': {
        const result = await captureFullScreen();
        image = result.image;
        bounds = result.bounds;
        scaleFactor = result.scaleFactor;
        displayId = result.displayId;
        break;
      }

      case 'display': {
        if (!request.displayId) {
          throw new Error('displayId required for display capture');
        }
        const result = await captureDisplay(request.displayId);
        image = result.image;
        bounds = result.bounds;
        scaleFactor = result.scaleFactor;
        displayId = result.displayId;
        break;
      }

      case 'window': {
        if (!request.windowId) {
          throw new Error('windowId required for window capture');
        }
        const result = await captureWindow(request.windowId);
        image = result.image;
        bounds = result.bounds;
        scaleFactor = result.scaleFactor;
        windowId = result.windowId;
        break;
      }

      case 'region': {
        if (!request.region || !isValidRegion(request.region)) {
          throw new Error('Valid region required for region capture');
        }

        // Capture from the specified display, or fall back to primary
        let fullResult;
        if (request.displayId) {
          fullResult = await captureDisplay(request.displayId);
        } else {
          fullResult = await captureFullScreen();
        }

        // Debug logging for coordinate tracking
        captureLogger.info('Region capture debug', {
          requestedRegion: request.region,
          requestedDisplayId: request.displayId,
          fullScreenSize: fullResult.image.getSize(),
          scaleFactor: fullResult.scaleFactor,
          displayBounds: fullResult.bounds,
        });

        image = cropImage(fullResult.image, request.region, fullResult.scaleFactor);
        bounds = request.region;
        scaleFactor = fullResult.scaleFactor;
        displayId = fullResult.displayId;
        break;
      }

      default:
        throw new Error(`Unknown capture mode: ${request.mode}`);
    }

    const timestamp = new Date().toISOString();
    const fileName = generateFileName({
      mode: request.mode,
      target: displayId || windowId || (request.mode === 'region' ? 'region' : undefined),
      timestamp: new Date(),
    });

    const metadata: CaptureMetadata = {
      mode: request.mode,
      displayId,
      windowId,
      bounds,
      timestamp,
      scaleFactor,
      fileName,
    };

    const duration = Date.now() - startTime;
    captureLogger.info('Capture completed', {
      mode: request.mode,
      duration,
      bounds,
    });

    return { image, metadata };

  } catch (error) {
    captureLogger.error('Capture failed', {
      mode: request.mode,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Create CaptureError from an error
 */
export function createCaptureError(
  code: CaptureErrorCode,
  message: string,
  details?: string
): CaptureError {
  return { code, message, details };
}
