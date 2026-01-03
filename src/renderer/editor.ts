/**
 * Editor Manager
 * Handles the canvas overlay and tools
 */

export class Editor {
    private container: HTMLElement;
    private image: HTMLImageElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private toolbar: HTMLElement;

    constructor(containerId: string, imageId: string, toolbarId: string) {
        this.container = document.getElementById(containerId) as HTMLElement;
        this.image = document.getElementById(imageId) as HTMLImageElement;
        this.toolbar = document.getElementById(toolbarId) as HTMLElement;

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
    }

    public loadImage(src: string) {
        this.image.src = src;
        this.image.classList.remove('preview-hidden');
        // Canvas resize will happen on 'onload'
    }

    public clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
