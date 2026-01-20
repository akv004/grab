/**
 * Capture types and interfaces based on SPEC-0003
 * @module shared/types
 */

/**
 * Supported capture modes
 */
export type CaptureMode = 'full-screen' | 'display' | 'window' | 'region';

/**
 * Region bounds for capture
 */
export interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Request to initiate a capture
 * Per SPEC-0003 Section 8: API Contract
 */
export interface CaptureRequest {
  mode: CaptureMode;
  displayId?: string;
  windowId?: string;
  region?: RegionBounds;
  copyToClipboard?: boolean;
  saveToDisk?: boolean;
}

/**
 * Metadata accompanying a capture result
 */
export interface CaptureMetadata {
  mode: CaptureMode;
  displayId?: string;
  windowId?: string;
  bounds: RegionBounds;
  timestamp: string;
  scaleFactor: number;
  fileName?: string;
}

/**
 * Result of a capture operation
 * Per SPEC-0003 Section 8: API Contract
 */
export interface CaptureResult {
  buffer: Buffer;
  filePath?: string;
  metadata: CaptureMetadata;
}

/**
 * Display/source information for capture
 */
export interface CaptureSource {
  id: string;
  name: string;
  thumbnail?: string;
  displayId?: string;
  appIcon?: string;
}

/**
 * User preferences for capture behavior
 * Per SPEC-0003 Section 9: Data Model / Storage
 */
export interface CapturePreferences {
  outputFolder: string;
  copyToClipboard: boolean;
  saveToDisk: boolean;
  defaultMode: CaptureMode;
  namingTemplate: string;
  shortcuts: {
    fullScreen: string;
    region: string;
    window: string;
  };
  openEditorAfterCapture?: boolean;
  hideEditorDuringCapture?: boolean;
  showNotifications?: boolean;
}

// DEFAULT_PREFERENCES moved to constants.ts

// IPC_CHANNELS moved to constants.ts

/**
 * Capture error codes
 */
export enum CaptureErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  CAPTURE_FAILED = 'CAPTURE_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  CLIPBOARD_FAILED = 'CLIPBOARD_FAILED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  CANCELLED = 'CANCELLED',
}

/**
 * Capture error with code and message
 */
export interface CaptureError {
  code: CaptureErrorCode;
  message: string;
  details?: string;
}
