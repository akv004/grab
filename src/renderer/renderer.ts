/**
 * Renderer process for Editor Window
 */

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';

// Elements
const previewImage = document.getElementById('preview-image') as HTMLImageElement;
const placeholder = document.querySelector('.placeholder') as HTMLElement;
const saveBtn = document.getElementById('save-btn');
const copyBtn = document.getElementById('copy-btn');
const closeBtn = document.getElementById('close-btn');

let currentFilePath: string | null = null;

const historyList = document.getElementById('history-list');

interface HistoryItem {
    id: string;
    filePath: string;
    timestamp: string;
    thumbnail?: string;
}

function loadHistory() {
    ipcRenderer.send(IPC_CHANNELS.HISTORY_GET);
}

// Render history items
ipcRenderer.on(IPC_CHANNELS.HISTORY_RESULT, (_event, items: HistoryItem[]) => {
    if (!historyList) return;

    historyList.innerHTML = '';

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'history-item';
        if (item.filePath === currentFilePath) {
            el.classList.add('active');
        }

        el.onclick = () => {
            // Request to show this image
            // We can just update locally for now
            updatePreview(item.filePath);
        };

        // Create thumbnail (using file protocol for MVP)
        const thumb = document.createElement('img');
        thumb.className = 'history-thumb';
        thumb.src = `file://${item.filePath}`;

        const date = document.createElement('div');
        date.className = 'history-date';
        date.innerText = new Date(item.timestamp).toLocaleTimeString();

        el.appendChild(thumb);
        el.appendChild(date);
        historyList.appendChild(el);
    });
});

function updatePreview(filePath: string) {
    currentFilePath = filePath;
    if (previewImage) {
        previewImage.src = `file://${filePath}?t=${Date.now()}`;
        previewImage.classList.remove('preview-hidden');
    }
    if (placeholder) {
        placeholder.style.display = 'none';
    }

    // Highlight active item
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    // Re-render or find active would be better, but for MVP:
    loadHistory();
}

// Initial history load
loadHistory();

// Listen for capture display request
ipcRenderer.on(IPC_CHANNELS.SHOW_CAPTURE, (_event, filePath: string) => {
    console.log('Displaying capture:', filePath);
    updatePreview(filePath);
});

// UI Actions - Placeholder for now
// These will send signals back to main normally, but for MVP 
// the main process already auto-saved/copied
if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        // Re-trigger save or open folder?
        console.log('Save clicked');
    });
}

if (copyBtn) {
    copyBtn.addEventListener('click', () => {
        console.log('Copy clicked');
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        window.close();
    });
}
