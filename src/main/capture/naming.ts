/**
 * File naming utilities for captured images
 * Per SPEC-0003 Section 9: Data Model / Storage
 * Naming convention: grab-YYYYMMDD-HHmmss-{mode}-{target}.png
 * @module main/capture/naming
 */

import * as path from 'path';
import { CaptureMode } from '../../shared/types';

/**
 * Format date as YYYYMMDD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format time as HHmmss
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}${minutes}${seconds}`;
}

/**
 * Sanitize a string for use in file names
 * Per SPEC-0003 Section 6 NFR: sanitize file naming to prevent path injection
 */
export function sanitizeFileName(name: string): string {
  // Remove or replace dangerous characters
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove illegal chars
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
    .substring(0, 100); // Limit length
}

/**
 * Get mode label for file naming
 */
function getModeLabel(mode: CaptureMode): string {
  switch (mode) {
    case 'full-screen':
      return 'fullscreen';
    case 'display':
      return 'display';
    case 'window':
      return 'window';
    case 'region':
      return 'region';
    default:
      return 'capture';
  }
}

export interface FileNameOptions {
  mode: CaptureMode;
  target?: string; // display ID, window ID, or 'region'
  extension?: string;
  timestamp?: Date;
}

/**
 * Generate a consistent file name for a capture
 * Per SPEC-0003 Section 9: grab-YYYYMMDD-HHmmss-{mode}-{target}.png
 */
export function generateFileName(options: FileNameOptions): string {
  const { mode, target, extension = 'png', timestamp = new Date() } = options;
  
  const dateStr = formatDate(timestamp);
  const timeStr = formatTime(timestamp);
  const modeStr = getModeLabel(mode);
  
  let fileName = `grab-${dateStr}-${timeStr}-${modeStr}`;
  
  if (target) {
    const sanitizedTarget = sanitizeFileName(target);
    if (sanitizedTarget) {
      fileName += `-${sanitizedTarget}`;
    }
  }
  
  return `${fileName}.${extension}`;
}

/**
 * Generate full file path for a capture
 */
export function generateFilePath(outputFolder: string, options: FileNameOptions): string {
  const fileName = generateFileName(options);
  return path.join(outputFolder, fileName);
}

/**
 * Parse template-based naming
 * Supports: {date}, {time}, {mode}, {target}
 */
export function parseNamingTemplate(
  template: string, 
  options: FileNameOptions
): string {
  const { mode, target, timestamp = new Date() } = options;
  
  let result = template
    .replace(/{date}/g, formatDate(timestamp))
    .replace(/{time}/g, formatTime(timestamp))
    .replace(/{mode}/g, getModeLabel(mode))
    .replace(/{target}/g, target ? sanitizeFileName(target) : '');
  
  // Clean up any empty segments
  result = result.replace(/--+/g, '-').replace(/^-+|-+$/g, '');
  
  return result;
}
