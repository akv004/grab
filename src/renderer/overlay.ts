/**
 * Region Selection Overlay Logic
 * Handles mouse events for click-and-drag region selection
 * Simplified approach without screen buffer for cleaner UX
 * @module renderer/overlay
 */

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { RegionBounds } from '../shared/types';

// Elements
const canvas = document.getElementById('selection-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const tooltip = document.getElementById('dimension-tooltip') as HTMLElement;
const dimensions = document.getElementById('dimensions') as HTMLElement;
const instructions = document.getElementById('instructions') as HTMLElement;

// Selection state
let isSelecting = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// Display info for coordinate translation
let displayOffsetX = 0;
let displayOffsetY = 0;
let scaleFactor = 1;

// Animation frame for marching ants
let animationFrame: number;
let dashOffset = 0;

/**
 * Initialize the canvas to full screen size
 */
function initCanvas(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawOverlay();
}

/**
 * Draw the selection rectangle (no overlay background - transparent)
 */
function drawOverlay(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // No background overlay - completely transparent
    // Only draw the selection when the user is dragging

    // If selecting, cut out the selection area
    if (isSelecting) {
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const w = Math.abs(currentX - startX);
        const h = Math.abs(currentY - startY);

        if (w > 0 && h > 0) {
            // Clear the selection area to show through to desktop
            ctx.clearRect(x, y, w, h);

            // Draw selection border - solid blue
            ctx.strokeStyle = '#007ACC';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.strokeRect(x, y, w, h);

            // Draw animated dashed overlay on top
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 6]);
            ctx.lineDashOffset = -dashOffset;
            ctx.strokeRect(x, y, w, h);

            // Draw corner handles
            const handleSize = 8;
            ctx.fillStyle = '#007ACC';
            ctx.setLineDash([]);

            // Top-left
            ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            // Top-right
            ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            // Bottom-left
            ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
            // Bottom-right
            ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
        }
    }
}

/**
 * Animate the marching ants effect
 */
function animateMarchingAnts(): void {
    dashOffset = (dashOffset + 0.5) % 12;
    if (isSelecting) {
        drawOverlay();
        animationFrame = requestAnimationFrame(animateMarchingAnts);
    }
}

/**
 * Update the dimension tooltip position and content
 */
function updateTooltip(e: MouseEvent): void {
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    dimensions.textContent = `${w} × ${h} px`;

    // Position tooltip near cursor but offset
    const offsetX = 15;
    const offsetY = 15;
    let tooltipX = e.clientX + offsetX;
    let tooltipY = e.clientY + offsetY;

    // Keep tooltip on screen
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipX + tooltipRect.width > window.innerWidth - 10) {
        tooltipX = e.clientX - offsetX - tooltipRect.width;
    }
    if (tooltipY + tooltipRect.height > window.innerHeight - 10) {
        tooltipY = e.clientY - offsetY - tooltipRect.height;
    }

    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${tooltipY}px`;
    tooltip.classList.add('visible');
}

/**
 * Handle mouse down - start selection
 */
function onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) {
        // Right click or other button - cancel
        cancelSelection();
        return;
    }

    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    currentX = e.clientX;
    currentY = e.clientY;

    instructions.style.opacity = '0';
    animateMarchingAnts();
    drawOverlay();
}

/**
 * Handle mouse move - update selection
 */
function onMouseMove(e: MouseEvent): void {
    if (!isSelecting) return;

    currentX = e.clientX;
    currentY = e.clientY;

    updateTooltip(e);
    drawOverlay();
}

/**
 * Handle mouse up - complete selection
 */
function onMouseUp(e: MouseEvent): void {
    if (!isSelecting) return;

    cancelAnimationFrame(animationFrame);
    isSelecting = false;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    // Minimum size check
    if (w < 10 || h < 10) {
        // Too small, reset and let user try again
        tooltip.classList.remove('visible');
        instructions.style.opacity = '1';
        drawOverlay();
        return;
    }

    // The coordinates are already relative to the overlay window which 
    // matches the captured screen image (both start at 0,0 for the primary display).
    // No offset translation needed - cropImage expects image-relative coordinates.
    const region: RegionBounds = {
        x: x,
        y: y,
        width: w,
        height: h,
    };

    // Send the selected region back to main process
    ipcRenderer.send(IPC_CHANNELS.REGION_SELECT_DONE, region);
}

/**
 * Cancel the selection
 */
function cancelSelection(): void {
    cancelAnimationFrame(animationFrame);
    isSelecting = false;
    ipcRenderer.send(IPC_CHANNELS.REGION_SELECT_CANCEL);
}

/**
 * Handle keyboard events
 */
function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
        cancelSelection();
    }
}

/**
 * Initialize the overlay
 */
function init(): void {
    initCanvas();

    // Attach event listeners
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', initCanvas);

    // Listen for display info from main process
    ipcRenderer.on('display-info', (_event, info: { x: number; y: number; width: number; height: number; scaleFactor: number }) => {
        displayOffsetX = info.x;
        displayOffsetY = info.y;
        scaleFactor = info.scaleFactor;
        console.log('Display info received:', info);
    });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
