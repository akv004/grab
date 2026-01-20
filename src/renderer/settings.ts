/**
 * Settings Window Renderer
 * Handles loading/saving preferences via IPC
 */

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { CapturePreferences } from '../shared/types';

// UI Elements
const hideEditorToggle = document.getElementById('hideEditor') as HTMLInputElement;
const copyClipboardToggle = document.getElementById('copyClipboard') as HTMLInputElement;
const saveToDiskToggle = document.getElementById('saveToDisk') as HTMLInputElement;
const showNotificationsToggle = document.getElementById('showNotifications') as HTMLInputElement;
const outputPathDisplay = document.getElementById('outputPath') as HTMLElement;
const browseFolderBtn = document.getElementById('browseFolder') as HTMLButtonElement;
const closeBtn = document.getElementById('closeBtn') as HTMLButtonElement;

let currentPreferences: CapturePreferences | null = null;

/**
 * Load preferences from main process
 */
function loadPreferences(): void {
    ipcRenderer.send(IPC_CHANNELS.PREFERENCES_GET);
}

/**
 * Save a preference change
 */
function savePreference(key: keyof CapturePreferences, value: any): void {
    if (currentPreferences) {
        (currentPreferences as any)[key] = value;
        ipcRenderer.send(IPC_CHANNELS.PREFERENCES_SET, currentPreferences);
    }
}

/**
 * Update UI with current preferences
 */
function updateUI(prefs: CapturePreferences): void {
    currentPreferences = prefs;

    hideEditorToggle.checked = prefs.hideEditorDuringCapture ?? false;
    copyClipboardToggle.checked = prefs.copyToClipboard ?? true;
    saveToDiskToggle.checked = prefs.saveToDisk ?? true;
    showNotificationsToggle.checked = prefs.showNotifications ?? true;
    outputPathDisplay.textContent = prefs.outputFolder || '(Not set)';
}

// Handle preferences result
ipcRenderer.on(IPC_CHANNELS.PREFERENCES_RESULT, (_event, prefs: CapturePreferences) => {
    updateUI(prefs);
});

// Setup event listeners
hideEditorToggle.addEventListener('change', () => {
    savePreference('hideEditorDuringCapture', hideEditorToggle.checked);
});

copyClipboardToggle.addEventListener('change', () => {
    savePreference('copyToClipboard', copyClipboardToggle.checked);
});

saveToDiskToggle.addEventListener('change', () => {
    savePreference('saveToDisk', saveToDiskToggle.checked);
});

showNotificationsToggle.addEventListener('change', () => {
    savePreference('showNotifications', showNotificationsToggle.checked);
});

browseFolderBtn.addEventListener('click', () => {
    ipcRenderer.send('settings:browse-folder');
});

// Handle folder selection result
ipcRenderer.on('settings:folder-selected', (_event, folderPath: string) => {
    if (folderPath) {
        outputPathDisplay.textContent = folderPath;
        savePreference('outputFolder', folderPath);
    }
});

closeBtn.addEventListener('click', () => {
    window.close();
});

// Load preferences on start
loadPreferences();
