import { scheduleSchema, employeeSchema, entitySchema } from '../schemas/index.js';
import { logger } from '../utils/logger.js';

/**
 * Service for validating data using Zod schemas
 * Provides structured validation results with field-level error details
 */
export class ValidationService {
  /**
   * Validate schedule data
   * @param {Object} data - Schedule data to validate
   * @returns {Object} { success: boolean, data?: Object, errors?: Array }
   */
  static validateSchedule(data) {
    try {
      const result = scheduleSchema.safeParse(data);
      
      if (result.success) {
        logger.debug('Schedule validation passed');
        return { success: true, data: result.data };
      }
      
      const errors = result.error?.issues?.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      })) || [];
      
      logger.warn('Schedule validation failed', { errors });
      
      return {
        success: false,
        errors
      };
    } catch (error) {
      logger.error('Schedule validation error:', error);
      return {
        success: false,
        errors: [{
          field: 'unknown',
          message: 'Validation failed due to an unexpected error',
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Validate employee data
   * @param {Object} data - Employee data to validate
   * @returns {Object} { success: boolean, data?: Object, errors?: Array }
   */
  static validateEmployee(data) {
    try {
      const result = employeeSchema.safeParse(data);
      
      if (result.success) {
        logger.debug('Employee validation passed');
        return { success: true, data: result.data };
      }
      
      const errors = result.error?.issues?.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      })) || [];
      
      logger.warn('Employee validation failed', { errors });
      
      return {
        success: false,
        errors
      };
    } catch (error) {
      logger.error('Employee validation error:', error);
      return {
        success: false,
        errors: [{
          field: 'unknown',
          message: 'Validation failed due to an unexpected error',
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Validate entity data
   * @param {Object} data - Entity data to validate
   * @returns {Object} { success: boolean, data?: Object, errors?: Array }
   */
  static validateEntity(data) {
    try {
      const result = entitySchema.safeParse(data);
      
      if (result.success) {
        logger.debug('Entity validation passed');
        return { success: true, data: result.data };
      }
      
      const errors = result.error?.issues?.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      })) || [];
      
      logger.warn('Entity validation failed', { errors });
      
      return {
        success: false,
        errors
      };
    } catch (error) {
      logger.error('Entity validation error:', error);
      return {
        success: false,
        errors: [{
          field: 'unknown',
          message: 'Validation failed due to an unexpected error',
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Validate any data against a custom schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Zod schema to validate against
   * @returns {Object} { success: boolean, data?: Object, errors?: Array }
   */
  static validate(data, schema) {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return { success: true, data: result.data };
      }
      
      const errors = result.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return {
        success: false,
        errors
      };
    } catch (error) {
      logger.error('Validation error:', error);
      return {
        success: false,
        errors: [{
          field: 'unknown',
          message: 'Validation failed due to an unexpected error',
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }
}
