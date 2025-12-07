/**
 * Logging utility for the Clinical Review Scheduler
 * Provides environment-aware logging that only logs in development mode
 * In production, errors should be sent to an error tracking service
 */

const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

/**
 * Log levels
 */
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Logger class
 */
class Logger {
  constructor() {
    this.enabled = isDev || isTest;
  }

  /**
   * Log error messages
   * Always logs in development, sends to error tracking in production
   */
  error(message, ...args) {
    if (this.enabled) {
      console.error(`[ERROR] ${message}`, ...args);
    }

    // TODO: Send to error tracking service in production
    // Example: Sentry.captureException(args[0] || new Error(message));
  }

  /**
   * Log warning messages
   * Only logs in development
   */
  warn(message, ...args) {
    if (this.enabled) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log info messages
   * Only logs in development
   */
  info(message, ...args) {
    if (this.enabled) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log debug messages
   * Only logs in development
   */
  debug(message, ...args) {
    if (this.enabled) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log Firebase operation
   */
  firebase(operation, collection, details = '') {
    this.debug(`Firebase ${operation}: ${collection}`, details);
  }

  /**
   * Log API call
   */
  api(method, endpoint, status, duration) {
    this.debug(`API ${method} ${endpoint} - ${status} (${duration}ms)`);
  }

  /**
   * Log user action
   */
  userAction(action, details = {}) {
    this.info(`User action: ${action}`, details);
    // TODO: Send to analytics service
  }

  /**
   * Log performance metric
   */
  performance(metric, value, unit = 'ms') {
    this.debug(`Performance: ${metric} = ${value}${unit}`);
    // TODO: Send to performance monitoring service
  }
}

// Export singleton instance
export const logger = new Logger();

export default logger;
