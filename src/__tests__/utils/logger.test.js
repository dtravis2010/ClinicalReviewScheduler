import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel } from '../../utils/logger.js';

describe('Logger Utility', () => {
  let consoleErrorSpy;
  let consoleWarnSpy;
  let consoleInfoSpy;
  let consoleDebugSpy;

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('error method', () => {
    it('should log error messages with [ERROR] prefix', () => {
      logger.error('Test error message');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Test error message');
    });

    it('should log error with additional arguments', () => {
      const errorObj = new Error('Test error');
      logger.error('Error occurred', errorObj, { context: 'test' });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] Error occurred',
        errorObj,
        { context: 'test' }
      );
    });

    it('should always log errors in test environment', () => {
      logger.error('Critical error');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('warn method', () => {
    it('should log warning messages with [WARN] prefix', () => {
      logger.warn('Test warning message');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Test warning message');
    });

    it('should log warning with additional arguments', () => {
      logger.warn('Warning occurred', { data: 'test' });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] Warning occurred',
        { data: 'test' }
      );
    });

    it('should log warnings in test environment', () => {
      logger.warn('Test warning');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('info method', () => {
    it('should log info messages with [INFO] prefix', () => {
      logger.info('Test info message');
      
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test info message');
    });

    it('should log info with additional arguments', () => {
      logger.info('Info message', { details: 'test' });
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Info message',
        { details: 'test' }
      );
    });

    it('should log info in test environment', () => {
      logger.info('Test info');
      
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('debug method', () => {
    it('should log debug messages with [DEBUG] prefix', () => {
      logger.debug('Test debug message');
      
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] Test debug message');
    });

    it('should log debug with additional arguments', () => {
      logger.debug('Debug message', { trace: 'test' });
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] Debug message',
        { trace: 'test' }
      );
    });

    it('should log debug in test environment', () => {
      logger.debug('Test debug');
      
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe('firebase method', () => {
    it('should log Firebase operations', () => {
      logger.firebase('read', 'schedules', { id: '123' });
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] Firebase read: schedules',
        { id: '123' }
      );
    });

    it('should log Firebase operations without details', () => {
      logger.firebase('write', 'employees');
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] Firebase write: employees',
        ''
      );
    });
  });

  describe('api method', () => {
    it('should log API calls with method, endpoint, status, and duration', () => {
      logger.api('GET', '/api/schedules', 200, 150);
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] API GET /api/schedules - 200 (150ms)'
      );
    });

    it('should log failed API calls', () => {
      logger.api('POST', '/api/employees', 500, 250);
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] API POST /api/employees - 500 (250ms)'
      );
    });
  });

  describe('userAction method', () => {
    it('should log user actions', () => {
      logger.userAction('schedule.create', { name: 'Test Schedule' });
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] User action: schedule.create',
        { name: 'Test Schedule' }
      );
    });

    it('should log user actions without details', () => {
      logger.userAction('employee.archive');
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] User action: employee.archive',
        {}
      );
    });
  });

  describe('performance method', () => {
    it('should log performance metrics with default unit (ms)', () => {
      logger.performance('render.time', 45);
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] Performance: render.time = 45ms'
      );
    });

    it('should log performance metrics with custom unit', () => {
      logger.performance('memory.usage', 128, 'MB');
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] Performance: memory.usage = 128MB'
      );
    });
  });

  describe('LogLevel enum', () => {
    it('should export log level constants', () => {
      expect(LogLevel.ERROR).toBe('error');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.DEBUG).toBe('debug');
    });
  });

  describe('environment-based logging', () => {
    it('should be enabled in test environment', () => {
      expect(logger.enabled).toBe(true);
    });

    it('should log all levels in test environment', () => {
      logger.error('error');
      logger.warn('warn');
      logger.info('info');
      logger.debug('debug');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });
});
