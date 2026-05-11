const fs = require('fs');
const path = require('path');

/**
 * Structured Logging System
 * 
 * Provides production-grade logging with:
 * - Multiple log levels (debug, info, warn, error)
 * - JSON-formatted output for easy parsing
 * - Automatic log file rotation (daily)
 * - Console output with color coding
 * - Contextual metadata (timestamp, level, module, etc.)
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
};

const LOG_COLORS = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m',
};

class Logger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(__dirname, 'logs');
    this.minLevel = LOG_LEVELS[options.level || 'INFO'];
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this.environment = process.env.NODE_ENV || 'development';

    // Ensure logs directory exists
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.currentLogFile = this.getLogFilePath();
  }

  /**
   * Get the current log file path based on date
   */
  getLogFilePath() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `app-${date}.log`);
  }

  /**
   * Check if we need to rotate to a new log file
   */
  checkLogRotation() {
    const newLogFile = this.getLogFilePath();
    if (newLogFile !== this.currentLogFile) {
      this.currentLogFile = newLogFile;
    }
  }

  /**
   * Format log entry as JSON
   */
  formatLogEntry(level, message, metadata = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: LOG_LEVEL_NAMES[level],
      message,
      environment: this.environment,
      ...metadata,
    });
  }

  /**
   * Write log to file
   */
  writeToFile(logEntry) {
    if (!this.enableFile) return;

    try {
      this.checkLogRotation();
      fs.appendFileSync(this.currentLogFile, logEntry + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  /**
   * Write log to console with color coding
   */
  writeToConsole(level, message, metadata = {}) {
    if (!this.enableConsole) return;

    const levelName = LOG_LEVEL_NAMES[level];
    const color = LOG_COLORS[levelName];
    const reset = LOG_COLORS.RESET;

    const timestamp = new Date().toISOString();
    let output = `${color}[${timestamp}] [${levelName}]${reset} ${message}`;

    if (Object.keys(metadata).length > 0) {
      output += ` ${JSON.stringify(metadata)}`;
    }

    if (level === LOG_LEVELS.ERROR) {
      console.error(output);
    } else if (level === LOG_LEVELS.WARN) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  /**
   * Internal log method
   */
  log(level, message, metadata = {}) {
    if (level < this.minLevel) return;

    const logEntry = this.formatLogEntry(level, message, metadata);
    this.writeToFile(logEntry);
    this.writeToConsole(level, message, metadata);
  }

  /**
   * Public logging methods
   */
  debug(message, metadata = {}) {
    this.log(LOG_LEVELS.DEBUG, message, metadata);
  }

  info(message, metadata = {}) {
    this.log(LOG_LEVELS.INFO, message, metadata);
  }

  warn(message, metadata = {}) {
    this.log(LOG_LEVELS.WARN, message, metadata);
  }

  error(message, metadata = {}) {
    this.log(LOG_LEVELS.ERROR, message, metadata);
  }

  /**
   * Log with context (module name, request ID, etc.)
   */
  withContext(context) {
    return {
      debug: (message, metadata = {}) => this.debug(message, { ...context, ...metadata }),
      info: (message, metadata = {}) => this.info(message, { ...context, ...metadata }),
      warn: (message, metadata = {}) => this.warn(message, { ...context, ...metadata }),
      error: (message, metadata = {}) => this.error(message, { ...context, ...metadata }),
    };
  }
}

// Create and export singleton instance
const logger = new Logger({
  level: process.env.LOG_LEVEL || 'INFO',
  enableConsole: true,
  enableFile: true,
});

module.exports = logger;
