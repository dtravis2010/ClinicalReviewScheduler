import { logger } from './logger.js';

/**
 * Error codes for application errors
 */
export const ErrorCodes = {
  // Firebase errors
  FIREBASE_PERMISSION_DENIED: 'FIREBASE_PERMISSION_DENIED',
  FIREBASE_NOT_FOUND: 'FIREBASE_NOT_FOUND',
  FIREBASE_NETWORK_ERROR: 'FIREBASE_NETWORK_ERROR',
  FIREBASE_UNAVAILABLE: 'FIREBASE_UNAVAILABLE',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED'
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, code = ErrorCodes.UNKNOWN_ERROR, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date();
  }
}

/**
 * Error handler utility
 * Transforms errors into user-friendly messages and logs them
 */
export class ErrorHandler {
  /**
   * Handle Firebase errors
   * @param {Error} error - Firebase error
   * @returns {AppError} Transformed error with user-friendly message
   */
  static handleFirebaseError(error) {
    logger.error('Firebase error:', error);

    const errorCode = error.code || '';
    let message = 'An error occurred. Please try again.';
    let code = ErrorCodes.UNKNOWN_ERROR;

    if (errorCode.includes('permission-denied')) {
      message = 'You don\'t have permission to perform this action.';
      code = ErrorCodes.FIREBASE_PERMISSION_DENIED;
    } else if (errorCode.includes('not-found')) {
      message = 'The requested resource was not found.';
      code = ErrorCodes.FIREBASE_NOT_FOUND;
    } else if (errorCode.includes('unavailable')) {
      message = 'Service is temporarily unavailable. Please try again later.';
      code = ErrorCodes.FIREBASE_UNAVAILABLE;
    } else if (errorCode.includes('network')) {
      message = 'Network error. Please check your connection and try again.';
      code = ErrorCodes.FIREBASE_NETWORK_ERROR;
    }

    return new AppError(message, code, error);
  }

  /**
   * Handle validation errors
   * @param {Object} validationResult - Validation result from ValidationService
   * @returns {AppError} Transformed error with validation details
   */
  static handleValidationError(validationResult) {
    const errorMessages = validationResult.errors
      .map(err => `${err.field}: ${err.message}`)
      .join(', ');

    logger.warn('Validation error:', { errors: validationResult.errors });

    return new AppError(
      `Validation failed: ${errorMessages}`,
      ErrorCodes.VALIDATION_ERROR,
      validationResult.errors
    );
  }

  /**
   * Handle generic errors
   * @param {Error} error - Any error
   * @param {string} context - Context where error occurred
   * @returns {AppError} Transformed error
   */
  static handleError(error, context = 'Operation') {
    logger.error(`${context} error:`, error);

    if (error instanceof AppError) {
      return error;
    }

    // Check if it's a Firebase error
    if (error.code && error.code.startsWith('firebase')) {
      return this.handleFirebaseError(error);
    }

    // Generic error
    return new AppError(
      `${context} failed. Please try again.`,
      ErrorCodes.OPERATION_FAILED,
      error
    );
  }

  /**
   * Check if error is retryable
   * @param {AppError} error - Application error
   * @returns {boolean} True if error is retryable
   */
  static isRetryable(error) {
    return [
      ErrorCodes.FIREBASE_NETWORK_ERROR,
      ErrorCodes.FIREBASE_UNAVAILABLE
    ].includes(error.code);
  }
}
