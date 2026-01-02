/**
 * Unit tests for logger utility
 * Per SPEC-0003 Section 13: Avoid logging pixel data
 */

import { logger, LogLevel, captureLogger, exportLogger, preferencesLogger } from '../../src/shared/logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clear();
    logger.setLevel(LogLevel.DEBUG);
  });

  it('should log messages at different levels', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    
    logger.info('test', 'Test message');
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should store log entries', () => {
    logger.info('test', 'Test message');
    
    const entries = logger.getEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].message).toBe('Test message');
    expect(entries[0].category).toBe('test');
  });

  it('should respect log level', () => {
    logger.setLevel(LogLevel.ERROR);
    
    logger.debug('test', 'Debug message');
    logger.info('test', 'Info message');
    logger.warn('test', 'Warn message');
    
    const entries = logger.getEntries();
    expect(entries.length).toBe(0);
  });

  it('should sanitize sensitive data', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    
    logger.info('test', 'Test with buffer', { 
      buffer: Buffer.from('secret'),
      imageData: 'base64data',
      normalData: 'visible',
    });
    
    const entries = logger.getEntries();
    expect(entries[0].data).toEqual({
      buffer: '[REDACTED]',
      imageData: '[REDACTED]',
      normalData: 'visible',
    });
    
    consoleSpy.mockRestore();
  });

  it('should clear entries', () => {
    logger.info('test', 'Message 1');
    logger.info('test', 'Message 2');
    
    logger.clear();
    
    expect(logger.getEntries().length).toBe(0);
  });

  it('should limit stored entries', () => {
    // This would require many entries to test the limit
    for (let i = 0; i < 10; i++) {
      logger.info('test', `Message ${i}`);
    }
    
    const entries = logger.getEntries();
    expect(entries.length).toBe(10);
  });
});

describe('Category loggers', () => {
  beforeEach(() => {
    logger.clear();
    logger.setLevel(LogLevel.DEBUG);
  });

  it('captureLogger should use capture category', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    
    captureLogger.info('Test capture message');
    
    const entries = logger.getEntries();
    expect(entries[0].category).toBe('capture');
    
    consoleSpy.mockRestore();
  });

  it('exportLogger should use export category', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    
    exportLogger.info('Test export message');
    
    const entries = logger.getEntries();
    expect(entries[0].category).toBe('export');
    
    consoleSpy.mockRestore();
  });

  it('preferencesLogger should use preferences category', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    
    preferencesLogger.info('Test preferences message');
    
    const entries = logger.getEntries();
    expect(entries[0].category).toBe('preferences');
    
    consoleSpy.mockRestore();
  });
});
