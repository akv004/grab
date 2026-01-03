/**
 * Renderer process for Editor Window
 */

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import { Editor } from './editor';

// Elements
// const previewImage = document.getElementById('preview-image') as HTMLImageElement; // Managed by Editor
const placeholder = document.querySelector('.placeholder') as HTMLElement;
const saveBtn = document.getElementById('save-btn');
const copyBtn = document.getElementById('copy-btn');
const closeBtn = document.getElementById('close-btn');

let currentFilePath: string | null = null;
let editor: Editor | null = null;

// Initialize Editor
window.addEventListener('DOMContentLoaded', () => {
    editor = new Editor('editor-stage', 'preview-image', 'context-toolbar');
});

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

    if (editor) {
        editor.loadImage(`file://${filePath}?t=${Date.now()}`);
    } else {
        // Fallback if editor not ready (though DOMContentLoaded handles it)
        const previewImage = document.getElementById('preview-image') as HTMLImageElement;
        if (previewImage) {
            previewImage.src = `file://${filePath}?t=${Date.now()}`;
            previewImage.classList.remove('preview-hidden');
        }
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

// UI Actions
const mapAction = (id: string, handler: (btn: HTMLElement) => void) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => handler(btn));
};

const showFeedback = (btn: HTMLElement, originalContent: string, feedbackContent: string) => {
    // Basic micro-interaction since we changed inner HTML structure
    const label = btn.querySelector('.label');
    if (!label) return;

    const originalText = label.textContent;
    label.textContent = feedbackContent;
    btn.classList.add('success'); // Assume styles.css handles this or we ignore for now

    setTimeout(() => {
        label.textContent = originalText;
        btn.classList.remove('success');
    }, 2000);
};

mapAction('copy-btn', (btn) => {
    if (editor) {
        const data = editor.getImageDataURL();
        ipcRenderer.send(IPC_CHANNELS.EDITOR_COPY, data);
        showFeedback(btn, '', 'Copied ✓');
    }
});

mapAction('save-btn', (btn) => {
    if (editor) {
        const data = editor.getImageDataURL();
        ipcRenderer.send(IPC_CHANNELS.EDITOR_SAVE, data);
    }
});

mapAction('reveal-btn', () => {
    if (currentFilePath) {
        ipcRenderer.send(IPC_CHANNELS.EDITOR_REVEAL, currentFilePath);
    }
});

mapAction('path-btn', (btn) => {
    if (currentFilePath) {
        // Copy text directly in renderer
        navigator.clipboard.writeText(currentFilePath);

        // Custom feedback for link-btn which doesn't have .label
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="icon">✅</span> Copied';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    }
});

mapAction('close-btn', () => {
    window.close();
});
