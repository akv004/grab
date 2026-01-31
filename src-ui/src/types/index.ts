/**
 * Shared types for Grab application
 * Mirrors the Rust types from src-tauri/src/types.rs
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
 */
export interface CaptureResult {
  filePath?: string;
  metadata: CaptureMetadata;
  copiedToClipboard: boolean;
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
 * Keyboard shortcut configuration
 */
export interface ShortcutConfig {
  fullScreen: string;
  region: string;
  window: string;
}

/**
 * User preferences for capture behavior
 */
export interface CapturePreferences {
  outputFolder: string;
  copyToClipboard: boolean;
  saveToDisk: boolean;
  defaultMode: CaptureMode;
  namingTemplate: string;
  shortcuts: ShortcutConfig;
  openEditorAfterCapture: boolean;
  hideEditorDuringCapture: boolean;
  showNotifications: boolean;
}

/**
 * History item for tracking recent captures
 */
export interface HistoryItem {
  id: string;
  filePath: string;
  timestamp: string;
  thumbnail?: string;
}

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
