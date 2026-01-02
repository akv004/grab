/**
 * Logging utility for capture operations
 * Per SPEC-0003 Section 12: Observability
 * @module shared/logger
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO;
  private entries: LogEntry[] = [];
  private maxEntries = 1000;

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private log(level: LogLevel, category: string, message: string, data?: Record<string, unknown>): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: this.sanitizeData(data),
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    const levelName = LogLevel[level];
    const prefix = `[${entry.timestamp}] [${levelName}] [${category}]`;
    
    // Avoid logging sensitive pixel data per SPEC-0003 Section 13
    const safeData = data ? JSON.stringify(entry.data) : '';
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, safeData);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, safeData);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, safeData);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, safeData);
        break;
    }
  }

  /**
   * Sanitize data to avoid logging sensitive information
   * Per SPEC-0003 Section 13: Security & Privacy
   */
  private sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return undefined;

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip buffer/pixel data
      if (key === 'buffer' || key === 'imageData' || key === 'pixels') {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  debug(category: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}

// Singleton logger instance
export const logger = new Logger();

// Convenience category loggers
export const captureLogger = {
  debug: (msg: string, data?: Record<string, unknown>) => logger.debug('capture', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => logger.info('capture', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => logger.warn('capture', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => logger.error('capture', msg, data),
};

export const exportLogger = {
  debug: (msg: string, data?: Record<string, unknown>) => logger.debug('export', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => logger.info('export', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => logger.warn('export', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => logger.error('export', msg, data),
};

export const preferencesLogger = {
  debug: (msg: string, data?: Record<string, unknown>) => logger.debug('preferences', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => logger.info('preferences', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => logger.warn('preferences', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => logger.error('preferences', msg, data),
};
