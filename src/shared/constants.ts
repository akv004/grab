/**
 * Shared constants
 * @module shared/constants
 */
import { CapturePreferences } from './types';

/**
 * IPC channel names for main/renderer communication
 */
export const IPC_CHANNELS = {
    // Capture operations
    CAPTURE_REQUEST: 'capture:request',
    CAPTURE_RESULT: 'capture:result',
    CAPTURE_ERROR: 'capture:error',
    CAPTURE_CANCEL: 'capture:cancel',
    SHOW_CAPTURE: 'capture:show',

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
    EDITOR_DELETE: 'editor:delete',
} as const;

/**
 * Default preferences
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

// CaptureErrorCode is in types.ts
