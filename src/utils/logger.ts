/**
 * Logging utility for the server
 *
 * @description Provides structured logging with configurable levels and outputs.
 * Replaces all console.* calls throughout the codebase with a proper logging system.
 *
 * @example
 * ```typescript
 * import {logger } from './utils/logger';
 *
 * logger.info('Server started', {port: 3000});
 * logger.error('Request failed', {error: err});
 * logger.debug('Processing request', { id: req.id});
 * ```
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown> | undefined;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /**
   * Minimum log level to output
   */
  level: LogLevel;

  /**
   * Enable colored output (for terminal)
   */
  colors: boolean;

  /**
   * Include timestamps in log output
   */
  timestamps: boolean;

  /**
   * Pretty print JSON data
   */
  prettyPrint: boolean;
}

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  GRAY: '\x1b[90m',
} as const;

/**
 * Logger class for structured logging
 */
export class Logger {
  private config: LoggerConfig;

  /**
   * Creates a new Logger instance
   *
   * @param config - Logger configuration options
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? this.getDefaultLogLevel(),
      colors: config.colors ?? true,
      timestamps: config.timestamps ?? true,
      prettyPrint: config.prettyPrint ?? this.isDevelopment(),
    };
  }

  /**
   * Log debug message
   *
   * @param message - Log message
   * @param data - Optional structured data
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   *
   * @param message - Log message
   * @param data - Optional structured data
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   *
   * @param message - Log message
   * @param data - Optional structured data
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   *
   * @param message - Log message
   * @param data - Optional structured data (can include error object)
   */
  error(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Update logger configuration
   *
   * @param config - Partial configuration to merge
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set log level
   *
   * @param level - New log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get default log level based on environment
   */
  private getDefaultLogLevel(): LogLevel {
    const env = process.env.NODE_ENV;
    if (env === 'production') {
      return LogLevel.INFO;
    }
    if (env === 'test') {
      return LogLevel.SILENT;
    }
    return LogLevel.DEBUG;
  }

  /**
   * Check if running in development mode
   */
  private isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Format timestamp for log output
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString();
  }

  /**
   * Get color code for log level
   */
  private getColor(level: LogLevel): string {
    if (!this.config.colors) {
      return '';
    }

    switch (level) {
      case LogLevel.DEBUG:
        return COLORS.GRAY;
      case LogLevel.INFO:
        return COLORS.BLUE;
      case LogLevel.WARN:
        return COLORS.YELLOW;
      case LogLevel.ERROR:
        return COLORS.RED;
      default:
        return COLORS.RESET;
    }
  }

  /**
   * Get level name as string
   */
  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'DEBUG';
      case LogLevel.INFO:
        return 'INFO';
      case LogLevel.WARN:
        return 'WARN';
      case LogLevel.ERROR:
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Format log entry for output
   */
  private format(entry: LogEntry): string {
    const parts: string[] = [];
    const color = this.getColor(entry.level);
    const reset = this.config.colors ? COLORS.RESET : '';

    // Timestamp
    if (this.config.timestamps) {
      parts.push(`[${this.formatTimestamp(entry.timestamp)}]`);
    }

    // Level
    parts.push(`${color}${this.getLevelName(entry.level)}${reset}`);

    // Message
    parts.push(entry.message);

    // Data
    if (entry.data && Object.keys(entry.data).length > 0) {
      const dataStr = this.config.prettyPrint
        ? JSON.stringify(entry.data, null, 2)
        : JSON.stringify(entry.data);
      parts.push(dataStr);
    }

    return parts.join(' ');
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
    };

    const formatted = this.format(entry);

    // Output to appropriate stream
    if (level >= LogLevel.ERROR) {
      process.stderr.write(formatted + '\n');
    } else {
      process.stdout.write(formatted + '\n');
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a custom logger instance
 *
 * @param config - Logger configuration
 * @returns New logger instance
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}
