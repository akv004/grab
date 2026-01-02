/**
 * Unit tests for capture naming utilities
 * Per TASK-0007: Unit tests for naming helper
 */

import { 
  sanitizeFileName, 
  generateFileName,
  generateFilePath,
  parseNamingTemplate,
} from '../../src/main/capture/naming';

describe('sanitizeFileName', () => {
  it('should remove illegal characters', () => {
    expect(sanitizeFileName('file<>:"/\\|?*name')).toBe('filename');
  });

  it('should replace spaces with dashes', () => {
    expect(sanitizeFileName('my file name')).toBe('my-file-name');
  });

  it('should collapse multiple dashes', () => {
    expect(sanitizeFileName('my---file---name')).toBe('my-file-name');
  });

  it('should trim leading and trailing dashes', () => {
    expect(sanitizeFileName('---file---')).toBe('file');
  });

  it('should limit length to 100 characters', () => {
    const longName = 'a'.repeat(150);
    expect(sanitizeFileName(longName).length).toBe(100);
  });

  it('should handle empty string', () => {
    expect(sanitizeFileName('')).toBe('');
  });

  it('should handle control characters', () => {
    expect(sanitizeFileName('file\x00\x1fname')).toBe('filename');
  });
});

describe('generateFileName', () => {
  const fixedDate = new Date('2026-01-15T10:30:45.000Z');

  it('should generate correct filename for full-screen mode', () => {
    const result = generateFileName({
      mode: 'full-screen',
      timestamp: fixedDate,
    });
    expect(result).toMatch(/^grab-20260115-\d{6}-fullscreen\.png$/);
  });

  it('should generate correct filename for display mode with target', () => {
    const result = generateFileName({
      mode: 'display',
      target: 'Display-1',
      timestamp: fixedDate,
    });
    expect(result).toMatch(/^grab-20260115-\d{6}-display-Display-1\.png$/);
  });

  it('should generate correct filename for window mode', () => {
    const result = generateFileName({
      mode: 'window',
      target: 'My Window',
      timestamp: fixedDate,
    });
    expect(result).toMatch(/^grab-20260115-\d{6}-window-My-Window\.png$/);
  });

  it('should generate correct filename for region mode', () => {
    const result = generateFileName({
      mode: 'region',
      timestamp: fixedDate,
    });
    expect(result).toMatch(/^grab-20260115-\d{6}-region\.png$/);
  });

  it('should support custom extension', () => {
    const result = generateFileName({
      mode: 'full-screen',
      extension: 'jpeg',
      timestamp: fixedDate,
    });
    expect(result).toMatch(/\.jpeg$/);
  });

  it('should sanitize target in filename', () => {
    const result = generateFileName({
      mode: 'window',
      target: 'My<>Window:Test',
      timestamp: fixedDate,
    });
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain(':');
  });
});

describe('generateFilePath', () => {
  const fixedDate = new Date('2026-01-15T10:30:45.000Z');

  it('should generate full path with output folder', () => {
    const result = generateFilePath('/Users/test/Pictures', {
      mode: 'full-screen',
      timestamp: fixedDate,
    });
    expect(result).toMatch(/^\/Users\/test\/Pictures\/grab-20260115-\d{6}-fullscreen\.png$/);
  });

  it('should handle Windows-style paths', () => {
    const result = generateFilePath('C:\\Users\\test\\Pictures', {
      mode: 'full-screen',
      timestamp: fixedDate,
    });
    expect(result).toContain('grab-');
    expect(result).toContain('.png');
  });
});

describe('parseNamingTemplate', () => {
  const fixedDate = new Date('2026-01-15T10:30:45.000Z');

  it('should replace {date} placeholder', () => {
    const result = parseNamingTemplate('capture-{date}', {
      mode: 'full-screen',
      timestamp: fixedDate,
    });
    expect(result).toBe('capture-20260115');
  });

  it('should replace {mode} placeholder', () => {
    const result = parseNamingTemplate('grab-{mode}', {
      mode: 'full-screen',
      timestamp: fixedDate,
    });
    expect(result).toBe('grab-fullscreen');
  });

  it('should replace {target} placeholder', () => {
    const result = parseNamingTemplate('grab-{target}', {
      mode: 'window',
      target: 'MyWindow',
      timestamp: fixedDate,
    });
    expect(result).toBe('grab-MyWindow');
  });

  it('should handle multiple placeholders', () => {
    const result = parseNamingTemplate('grab-{date}-{mode}-{target}', {
      mode: 'display',
      target: 'Monitor1',
      timestamp: fixedDate,
    });
    expect(result).toBe('grab-20260115-display-Monitor1');
  });

  it('should clean up empty target segments', () => {
    const result = parseNamingTemplate('grab-{mode}-{target}', {
      mode: 'full-screen',
      timestamp: fixedDate,
    });
    // Should not have trailing dash from empty target
    expect(result).not.toMatch(/-$/);
  });
});
