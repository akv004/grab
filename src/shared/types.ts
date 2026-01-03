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
}

/**
 * Default preferences
 * Note: outputFolder is intentionally empty as it will be set to platform-specific
 * defaults by the PreferencesStore when it initializes
 */
export const DEFAULT_PREFERENCES: CapturePreferences = {
  outputFolder: '', // Set by PreferencesStore.getDefaultOutputFolder()
  copyToClipboard: true,
  saveToDisk: true,
  defaultMode: 'full-screen',
  namingTemplate: 'grab-{date}-{time}-{mode}',
  shortcuts: {
    fullScreen: 'CommandOrControl+Shift+1',
    region: 'CommandOrControl+Shift+2',
    window: 'CommandOrControl+Shift+3',
  },
  openEditorAfterCapture: false,
};

/**
 * IPC channel names for main/renderer communication
 */
export const IPC_CHANNELS = {
  // Capture operations
  CAPTURE_REQUEST: 'capture:request',
  CAPTURE_RESULT: 'capture:result',
  CAPTURE_ERROR: 'capture:error',
  CAPTURE_CANCEL: 'capture:cancel',
  SHOW_CAPTURE: 'capture:show', // Added based on instruction

  // History
  HISTORY_GET: 'history:get',
  HISTORY_RESULT: 'history:result',

  // Source enumeration
  GET_SOURCES: 'sources:get',
  SOURCES_RESULT: 'sources:result',

  // Region selection
  REGION_SELECT_START: 'region:select:start',
  REGION_SELECT_DONE: 'region:select:done',
  REGION_SELECT_CANCEL: 'region:select:cancel',

  // Preferences
  PREFERENCES_GET: 'preferences:get',
  PREFERENCES_SET: 'preferences:set',
  PREFERENCES_RESULT: 'preferences:result',

  // Notifications
  NOTIFY_SUCCESS: 'notify:success',
  NOTIFY_ERROR: 'notify:error',

  // Editor Actions
  EDITOR_COPY: 'editor:copy',
  EDITOR_SAVE: 'editor:save',
  EDITOR_REVEAL: 'editor:reveal',
} as const;

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
