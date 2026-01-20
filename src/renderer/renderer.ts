/**
 * Renderer process for Editor Window
 */

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
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

// Handle history updates
ipcRenderer.on(IPC_CHANNELS.HISTORY_RESULT, (_event, items: HistoryItem[]) => {
    if (editor) {
        editor.populateSidebar(items);
    }
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

// Keyboard shortcut: Ctrl+C / Cmd+C to copy the currently displayed image
window.addEventListener('keydown', (e) => {
    // Only handle Ctrl+C / Cmd+C when not in an input field
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // Don't override if user has text selected
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return; // Let default copy behavior happen for text
        }

        e.preventDefault();
        if (editor) {
            const data = editor.getImageDataURL();
            ipcRenderer.send(IPC_CHANNELS.EDITOR_COPY, data);

            // Visual feedback on the copy button
            const copyBtn = document.getElementById('copy-btn');
            if (copyBtn) {
                const label = copyBtn.querySelector('.label');
                if (label) {
                    const originalText = label.textContent;
                    label.textContent = 'Copied ✓';
                    setTimeout(() => {
                        label.textContent = originalText;
                    }, 1500);
                }
            }
        }
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

mapAction('delete-btn', () => {
    if (editor) {
        const filePath = editor.getCurrentFilePath();
        if (filePath) {
            // Show confirmation dialog
            const confirmed = confirm(`Are you sure you want to delete this screenshot?\n\n${filePath}`);
            if (confirmed) {
                ipcRenderer.send(IPC_CHANNELS.EDITOR_DELETE, filePath);
            }
        }
    }
});

// Listen for delete result to refresh history
ipcRenderer.on('editor:delete:result', (_event, success: boolean) => {
    if (success) {
        loadHistory(); // Refresh the history list
    }
});

mapAction('close-btn', () => {
    window.close();
});
