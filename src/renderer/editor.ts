/**
 * Editor Manager
 * Handles the canvas overlay and tools
 */

type ToolType = 'crop' | 'focus' | 'text' | 'blur' | 'undo' | null;

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export class Editor {
    private container: HTMLElement;
    private image: HTMLImageElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private toolbar: HTMLElement;

    // State
    private currentTool: ToolType = null;
    private isDrawing = false;
    private startPos = { x: 0, y: 0 };
    private currentRect: Rect | null = null;

    // Tool buttons
    private tools: Record<string, HTMLElement> = {};

    // Track the current file path for copy/save operations
    private currentFilePath: string | null = null;

    constructor(containerId: string, imageId: string, toolbarId: string) {
        this.container = document.getElementById(containerId) as HTMLElement;
        this.image = document.getElementById(imageId) as HTMLImageElement;
        this.toolbar = document.getElementById(toolbarId) as HTMLElement;

        // Map buttons
        const toolIds = ['crop', 'focus', 'text', 'blur', 'undo'];
        toolIds.forEach(id => {
            const btn = document.getElementById(`tool-${id}`);
            if (btn) {
                this.tools[id] = btn;
                btn.onclick = () => this.selectTool(id as ToolType);
            }
        });

        // Create canvas if it doesn't exist
        let canvas = this.container.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'editor-canvas';
            this.container.appendChild(canvas);
        }
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;

        this.setupEvents();
    }

    private setupEvents() {
        // Resize canvas to match image when image loads
        this.image.onload = () => {
            this.resizeCanvas();
            this.toolbar.style.display = 'flex';
        };

        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        // Canvas interactions
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key.toLowerCase()) {
                case 'c': this.selectTool('crop'); break;
                case 'f': this.selectTool('focus'); break;
                case 'b': this.selectTool('blur'); break;
                case 't': this.selectTool('text'); break;
                case 'enter':
                    if (this.currentTool === 'crop' && this.currentRect) {
                        this.applyCrop();
                    }
                    break;
                case 'escape':
                    this.currentTool = null;
                    this.currentRect = null;
                    this.redraw();
                    // Optional: Close window if no tool active?
                    break;
                case 'z':
                    if (e.metaKey || e.ctrlKey) {
                        // Undo logic
                        console.log('Undo triggered');
                    }
                    break;
            }
        });
    }

    private resizeCanvas() {
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        this.canvas.style.width = `${this.image.width}px`;
        this.canvas.style.height = `${this.image.height}px`;

        // Position canvas exactly over image
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = `${this.image.offsetLeft}px`;
        this.canvas.style.top = `${this.image.offsetTop}px`;

        this.updateToolbarPosition();
        this.redraw();
    }

    private updateToolbarPosition() {
        const toolbarHeight = this.toolbar.offsetHeight || 50;
        const offset = 24;
        const centerX = this.image.offsetLeft + (this.image.width / 2);

        this.toolbar.style.left = `${centerX}px`;

        let topY = this.image.offsetTop - toolbarHeight - offset;
        if (topY < 10) topY = 10;
        this.toolbar.style.top = `${topY}px`;
    }

    public loadImage(src: string) {
        // Track the file path (strip file:// prefix and query params if present)
        if (src.startsWith('file://')) {
            this.currentFilePath = src.replace('file://', '').split('?')[0];
        } else if (src.startsWith('/')) {
            this.currentFilePath = src.split('?')[0];
        } else {
            // Data URL or other - no file path
            this.currentFilePath = null;
        }
        this.image.src = src;
        this.image.classList.remove('preview-hidden');
    }

    public selectTool(tool: ToolType) {
        if (tool === 'undo') return; // TODO: Implement undo

        this.currentTool = tool;

        // UI Update
        Object.values(this.tools).forEach(b => b.classList.remove('active'));
        if (tool && this.tools[tool]) {
            this.tools[tool].classList.add('active');
        }

        // Cursor
        this.canvas.style.cursor = tool ? 'crosshair' : 'default';

        // Reset state
        this.currentRect = null;
        this.redraw();
    }

    // --- Drawing Logic ---

    private onMouseDown(e: MouseEvent) {
        if (!this.currentTool) return;

        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.currentRect = { x: this.startPos.x, y: this.startPos.y, w: 0, h: 0 };
    }

    private onMouseMove(e: MouseEvent) {
        if (!this.isDrawing || !this.currentTool) return;

        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        this.currentRect = {
            x: Math.min(this.startPos.x, currentX),
            y: Math.min(this.startPos.y, currentY),
            w: Math.abs(currentX - this.startPos.x),
            h: Math.abs(currentY - this.startPos.y)
        };

        this.redraw();
    }

    private onMouseUp() {
        this.isDrawing = false;
        // Logic to finalize shape would go here (e.g. push to history)
    }

    private redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentRect) {
            if (this.currentTool === 'focus') {
                this.drawFocusEffect();
            } else if (this.currentTool === 'crop') {
                this.drawCropSelection();
            } else if (this.currentTool === 'text') {
                // Text preview
            }
        }
    }

    private drawFocusEffect() {
        if (!this.currentRect) return;

        // 1. Dim the entire screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // 60% Dim
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Cut out the focus area (Composite Operation)
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillRect(
            this.currentRect.x,
            this.currentRect.y,
            this.currentRect.w,
            this.currentRect.h
        );

        // 3. Reset composite for future drawing
        this.ctx.globalCompositeOperation = 'source-over';

        // 4. (Optional) Add a subtle border to the focus area
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            this.currentRect.x,
            this.currentRect.y,
            this.currentRect.w,
            this.currentRect.h
        );
    }

    private drawCropSelection() {
        if (!this.currentRect) return;

        // Draw dashed selection
        this.ctx.strokeStyle = '#fff';
        this.ctx.setLineDash([5, 5]);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.currentRect.x,
            this.currentRect.y,
            this.currentRect.w,
            this.currentRect.h
        );
        this.ctx.setLineDash([]);

        // Dim outside
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.currentRect.y); // Top
        this.ctx.fillRect(0, this.currentRect.y + this.currentRect.h, this.canvas.width, this.canvas.height - (this.currentRect.y + this.currentRect.h)); // Bottom
        this.ctx.fillRect(0, this.currentRect.y, this.currentRect.x, this.currentRect.h); // Left
        this.ctx.fillRect(this.currentRect.x + this.currentRect.w, this.currentRect.y, this.canvas.width - (this.currentRect.x + this.currentRect.w), this.currentRect.h); // Right
    }

    public applyCrop() {
        if (!this.currentRect || this.currentRect.w <= 0 || this.currentRect.h <= 0) return;

        // Calculate scale factor (Natural / Displayed)
        const scaleX = this.image.naturalWidth / this.image.width;
        const scaleY = this.image.naturalHeight / this.image.height;

        // Map selection to natural image coordinates
        const sourceX = this.currentRect.x * scaleX;
        const sourceY = this.currentRect.y * scaleY;
        const sourceW = this.currentRect.w * scaleX;
        const sourceH = this.currentRect.h * scaleY;

        // 1. Create a temp canvas at the target (natural) resolution
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = sourceW;
        tempCanvas.height = sourceH;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // 2. Draw the cropped portion using natural coordinates
        tempCtx.drawImage(
            this.image,
            sourceX,
            sourceY,
            sourceW,
            sourceH,
            0,
            0,
            sourceW,
            sourceH
        );

        // 3. Get new Data URL
        const newDataUrl = tempCanvas.toDataURL('image/png');

        // 4. Update the main image source
        this.image.src = newDataUrl;

        // 5. Reset Tool State
        this.currentRect = null;
        this.currentTool = null;
        this.selectTool(null);
    }

    public getImageDataURL(): string {
        // If the image is from a file (not edited), return the file path
        // The main process will read from the path for better quality
        if (this.currentFilePath && !this.image.src.startsWith('data:')) {
            return this.currentFilePath;
        }
        // For edited images (data URLs), return the data URL
        return this.image.src;
    }

    /**
     * Get the current file path (for reveal in finder, etc.)
     */
    public getCurrentFilePath(): string | null {
        return this.currentFilePath;
    }

    public clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public populateSidebar(history: any[]) {
        console.log('Populating sidebar with', history.length, 'items');
        const sidebar = document.querySelector('.history-list');
        if (!sidebar) return;

        sidebar.innerHTML = '';

        // Sort items by date (newest first)
        const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Group by Date
        const groups: Record<string, any[]> = {};
        sortedHistory.forEach(item => {
            const date = new Date(item.timestamp);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let groupName = date.toLocaleDateString();

            if (date.toDateString() === today.toDateString()) {
                groupName = 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                groupName = 'Yesterday';
            }

            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(item);
        });

        // Render Groups
        Object.keys(groups).forEach(groupName => {
            // Group Header
            const header = document.createElement('div');
            header.className = 'sidebar-header';
            header.innerText = groupName;
            sidebar.appendChild(header);

            // Items
            groups[groupName].forEach(item => {
                const el = document.createElement('div');
                el.className = 'history-item';
                el.onclick = () => {
                    this.loadImage(`file://${item.filePath}?t=${Date.now()}`);
                    // Update active state
                    document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
                    el.classList.add('active');
                };

                // Thumbnail (if available) or Placeholder
                const thumb = document.createElement('div');
                thumb.className = 'history-thumb';
                thumb.style.backgroundImage = `url('file://${item.filePath}')`; // Simple file URL for now
                thumb.style.backgroundSize = 'cover';
                thumb.style.backgroundPosition = 'center';

                // Timestamp
                const time = document.createElement('div');
                time.className = 'history-date';
                time.innerText = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                el.appendChild(thumb);
                el.appendChild(time);
                sidebar.appendChild(el);
            });
        });

        // Auto-select first item if exists
        if (sortedHistory.length > 0) {
            const firstItem = sidebar.querySelector('.history-item') as HTMLElement;
            if (firstItem) {
                firstItem.click();
            }
        }
    }
}
