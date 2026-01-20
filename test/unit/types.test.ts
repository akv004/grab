/**
 * Unit tests for shared types and constants
 * Per TASK-0007: Unit tests for metadata generation
 */

import {
  CaptureMode,
  CaptureRequest,
  CaptureResult,
  CaptureMetadata,
  CapturePreferences,
  CaptureErrorCode,
} from '../../src/shared/types';
import { DEFAULT_PREFERENCES, IPC_CHANNELS } from '../../src/shared/constants';

describe('DEFAULT_PREFERENCES', () => {
  it('should have all required fields', () => {
    expect(DEFAULT_PREFERENCES).toHaveProperty('outputFolder');
    expect(DEFAULT_PREFERENCES).toHaveProperty('copyToClipboard');
    expect(DEFAULT_PREFERENCES).toHaveProperty('saveToDisk');
    expect(DEFAULT_PREFERENCES).toHaveProperty('defaultMode');
    expect(DEFAULT_PREFERENCES).toHaveProperty('namingTemplate');
    expect(DEFAULT_PREFERENCES).toHaveProperty('shortcuts');
  });

  it('should have clipboard enabled by default', () => {
    expect(DEFAULT_PREFERENCES.copyToClipboard).toBe(true);
  });

  it('should have save to disk enabled by default', () => {
    expect(DEFAULT_PREFERENCES.saveToDisk).toBe(true);
  });

  it('should have full-screen as default mode', () => {
    expect(DEFAULT_PREFERENCES.defaultMode).toBe('full-screen');
  });

  it('should have proper shortcut defaults', () => {
    expect(DEFAULT_PREFERENCES.shortcuts.fullScreen).toBe('CommandOrControl+Shift+1');
    expect(DEFAULT_PREFERENCES.shortcuts.region).toBe('CommandOrControl+Shift+2');
    expect(DEFAULT_PREFERENCES.shortcuts.window).toBe('CommandOrControl+Shift+3');
  });
});

describe('IPC_CHANNELS', () => {
  it('should have all capture channels', () => {
    expect(IPC_CHANNELS.CAPTURE_REQUEST).toBeDefined();
    expect(IPC_CHANNELS.CAPTURE_RESULT).toBeDefined();
    expect(IPC_CHANNELS.CAPTURE_ERROR).toBeDefined();
    expect(IPC_CHANNELS.CAPTURE_CANCEL).toBeDefined();
  });

  it('should have all source channels', () => {
    expect(IPC_CHANNELS.GET_SOURCES).toBeDefined();
    expect(IPC_CHANNELS.SOURCES_RESULT).toBeDefined();
  });

  it('should have all region selection channels', () => {
    expect(IPC_CHANNELS.REGION_SELECT_START).toBeDefined();
    expect(IPC_CHANNELS.REGION_SELECT_DONE).toBeDefined();
    expect(IPC_CHANNELS.REGION_SELECT_CANCEL).toBeDefined();
  });

  it('should have all preferences channels', () => {
    expect(IPC_CHANNELS.PREFERENCES_GET).toBeDefined();
    expect(IPC_CHANNELS.PREFERENCES_SET).toBeDefined();
    expect(IPC_CHANNELS.PREFERENCES_RESULT).toBeDefined();
  });

  it('should have all notification channels', () => {
    expect(IPC_CHANNELS.NOTIFY_SUCCESS).toBeDefined();
    expect(IPC_CHANNELS.NOTIFY_ERROR).toBeDefined();
  });
});

describe('CaptureErrorCode', () => {
  it('should have all error codes', () => {
    expect(CaptureErrorCode.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
    expect(CaptureErrorCode.SOURCE_NOT_FOUND).toBe('SOURCE_NOT_FOUND');
    expect(CaptureErrorCode.CAPTURE_FAILED).toBe('CAPTURE_FAILED');
    expect(CaptureErrorCode.EXPORT_FAILED).toBe('EXPORT_FAILED');
    expect(CaptureErrorCode.CLIPBOARD_FAILED).toBe('CLIPBOARD_FAILED');
    expect(CaptureErrorCode.INVALID_REQUEST).toBe('INVALID_REQUEST');
    expect(CaptureErrorCode.CANCELLED).toBe('CANCELLED');
  });
});

describe('Type contracts', () => {
  it('should allow valid CaptureRequest for full-screen', () => {
    const request: CaptureRequest = {
      mode: 'full-screen',
    };
    expect(request.mode).toBe('full-screen');
  });

  it('should allow valid CaptureRequest for display', () => {
    const request: CaptureRequest = {
      mode: 'display',
      displayId: '12345',
    };
    expect(request.mode).toBe('display');
    expect(request.displayId).toBe('12345');
  });

  it('should allow valid CaptureRequest for window', () => {
    const request: CaptureRequest = {
      mode: 'window',
      windowId: 'window:123',
    };
    expect(request.mode).toBe('window');
    expect(request.windowId).toBe('window:123');
  });

  it('should allow valid CaptureRequest for region', () => {
    const request: CaptureRequest = {
      mode: 'region',
      region: { x: 0, y: 0, width: 100, height: 100 },
    };
    expect(request.mode).toBe('region');
    expect(request.region).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });

  it('should allow valid CaptureMetadata', () => {
    const metadata: CaptureMetadata = {
      mode: 'full-screen',
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      timestamp: '2026-01-15T10:30:45.000Z',
      scaleFactor: 2,
    };
    expect(metadata.mode).toBe('full-screen');
    expect(metadata.scaleFactor).toBe(2);
  });
});
