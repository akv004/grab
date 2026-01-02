/**
 * Export pipeline for saving captures to disk and clipboard
 * Per SPEC-0003 Section 6: FR-6 default export behavior
 * @module main/export/exporter
 */

import { NativeImage, clipboard, nativeImage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { CaptureMetadata, CaptureResult, CaptureMode } from '../../shared/types';
import { exportLogger } from '../../shared/logger';
import { generateFilePath } from '../capture/naming';

export interface ExportOptions {
  saveToDisk: boolean;
  copyToClipboard: boolean;
  outputFolder: string;
}

export interface ExportResult {
  filePath?: string;
  copiedToClipboard: boolean;
  buffer: Buffer;
}

/**
 * Ensure output directory exists
 */
async function ensureOutputDir(outputFolder: string): Promise<void> {
  try {
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
      exportLogger.info('Created output directory', { path: outputFolder });
    }
  } catch (error) {
    exportLogger.error('Failed to create output directory', { 
      path: outputFolder,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Save image to disk
 * Per FR-6: Save to configured output folder with consistent naming
 */
async function saveToDisk(
  image: NativeImage, 
  metadata: CaptureMetadata,
  outputFolder: string
): Promise<string> {
  const startTime = Date.now();
  
  await ensureOutputDir(outputFolder);
  
  const filePath = generateFilePath(outputFolder, {
    mode: metadata.mode,
    target: metadata.displayId || metadata.windowId || (metadata.mode === 'region' ? 'region' : undefined),
    timestamp: new Date(metadata.timestamp),
  });
  
  try {
    const buffer = image.toPNG();
    fs.writeFileSync(filePath, buffer);
    
    const duration = Date.now() - startTime;
    exportLogger.info('File saved', { 
      path: filePath, 
      size: buffer.length,
      duration,
    });
    
    return filePath;
  } catch (error) {
    exportLogger.error('Failed to save file', { 
      path: filePath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Copy image to clipboard
 * Per FR-6: Copy image to clipboard by default
 */
function copyToClipboard(image: NativeImage): void {
  const startTime = Date.now();
  
  try {
    clipboard.writeImage(image);
    
    const duration = Date.now() - startTime;
    exportLogger.info('Copied to clipboard', { duration });
  } catch (error) {
    exportLogger.error('Failed to copy to clipboard', { 
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Export a captured image to disk and/or clipboard
 * Per SPEC-0003 FR-6: Default export behavior saves to configured output folder
 * with consistent naming and copies image to clipboard; both are toggleable via settings
 */
export async function exportCapture(
  image: NativeImage,
  metadata: CaptureMetadata,
  options: ExportOptions
): Promise<ExportResult> {
  exportLogger.info('Starting export', { 
    saveToDisk: options.saveToDisk,
    copyToClipboard: options.copyToClipboard,
    mode: metadata.mode,
  });
  
  const result: ExportResult = {
    copiedToClipboard: false,
    buffer: image.toPNG(),
  };
  
  // Save to disk if enabled
  // Per SPEC-0003 Section 11: If output folder missing/unwritable, still copy to clipboard
  if (options.saveToDisk) {
    try {
      result.filePath = await saveToDisk(image, metadata, options.outputFolder);
    } catch (error) {
      exportLogger.warn('Disk save failed, continuing with clipboard', { 
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - continue with clipboard copy
    }
  }
  
  // Copy to clipboard if enabled
  if (options.copyToClipboard) {
    try {
      copyToClipboard(image);
      result.copiedToClipboard = true;
    } catch (error) {
      exportLogger.warn('Clipboard copy failed', { 
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw if we at least saved to disk
      if (!result.filePath) {
        throw error;
      }
    }
  }
  
  // At least one export method must succeed
  if (!result.filePath && !result.copiedToClipboard) {
    throw new Error('Export failed: neither disk save nor clipboard copy succeeded');
  }
  
  exportLogger.info('Export completed', { 
    filePath: result.filePath,
    copiedToClipboard: result.copiedToClipboard,
  });
  
  return result;
}

/**
 * Convert NativeImage to different formats
 */
export function imageToFormat(image: NativeImage, format: 'png' | 'jpeg'): Buffer {
  switch (format) {
    case 'png':
      return image.toPNG();
    case 'jpeg':
      return image.toJPEG(90); // 90% quality
    default:
      return image.toPNG();
  }
}

/**
 * Create NativeImage from buffer
 */
export function bufferToImage(buffer: Buffer): NativeImage {
  return nativeImage.createFromBuffer(buffer);
}
