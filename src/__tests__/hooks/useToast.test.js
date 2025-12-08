import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import toast from 'react-hot-toast';
import { useToast } from '../../hooks/useToast.jsx';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  const mockToast = vi.fn();
  mockToast.success = vi.fn();
  mockToast.error = vi.fn();
  mockToast.loading = vi.fn(() => 'toast-id');
  mockToast.dismiss = vi.fn();
  
  return {
    default: mockToast
  };
});

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showSuccess', () => {
    it('should call toast.success with message', () => {
      const { result } = renderHook(() => useToast());

      result.current.showSuccess('Operation successful');

      expect(toast.success).toHaveBeenCalledWith('Operation successful', {
        icon: '✓'
      });
    });
  });

  describe('showError', () => {
    it('should call toast.error with message', () => {
      const { result } = renderHook(() => useToast());

      result.current.showError('Operation failed');

      expect(toast.error).toHaveBeenCalledWith('Operation failed', {
        icon: '✕'
      });
    });
  });

  describe('showWarning', () => {
    it('should call toast with warning styling', () => {
      const { result } = renderHook(() => useToast());

      result.current.showWarning('Warning message');

      expect(toast).toHaveBeenCalledWith('Warning message', expect.objectContaining({
        icon: '⚠',
        style: expect.objectContaining({
          background: '#fef3c7',
          color: '#92400e'
        })
      }));
    });
  });

  describe('showInfo', () => {
    it('should call toast with info styling', () => {
      const { result } = renderHook(() => useToast());

      result.current.showInfo('Info message');

      expect(toast).toHaveBeenCalledWith('Info message', expect.objectContaining({
        icon: 'ℹ',
        style: expect.objectContaining({
          background: '#e6f0ff',
          color: '#003d7a'
        })
      }));
    });
  });

  describe('showLoading', () => {
    it('should call toast.loading and return toast ID', () => {
      const { result } = renderHook(() => useToast());

      const toastId = result.current.showLoading('Loading...');

      expect(toast.loading).toHaveBeenCalledWith('Loading...');
      expect(toastId).toBe('toast-id');
    });
  });

  describe('dismiss', () => {
    it('should call toast.dismiss with toast ID', () => {
      const { result } = renderHook(() => useToast());

      result.current.dismiss('toast-123');

      expect(toast.dismiss).toHaveBeenCalledWith('toast-123');
    });
  });

  describe('dismissAll', () => {
    it('should call toast.dismiss without arguments', () => {
      const { result } = renderHook(() => useToast());

      result.current.dismissAll();

      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('update', () => {
    it('should dismiss old toast and show success toast', () => {
      const { result } = renderHook(() => useToast());

      result.current.update('toast-123', { type: 'success', message: 'Success!' });

      expect(toast.dismiss).toHaveBeenCalledWith('toast-123');
      expect(toast.success).toHaveBeenCalledWith('Success!');
    });

    it('should dismiss old toast and show error toast', () => {
      const { result } = renderHook(() => useToast());

      result.current.update('toast-123', { type: 'error', message: 'Error!' });

      expect(toast.dismiss).toHaveBeenCalledWith('toast-123');
      expect(toast.error).toHaveBeenCalledWith('Error!');
    });
  });

  describe('return value', () => {
    it('should return all toast methods', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current).toHaveProperty('showSuccess');
      expect(result.current).toHaveProperty('showError');
      expect(result.current).toHaveProperty('showWarning');
      expect(result.current).toHaveProperty('showInfo');
      expect(result.current).toHaveProperty('showLoading');
      expect(result.current).toHaveProperty('showConfirm');
      expect(result.current).toHaveProperty('dismiss');
      expect(result.current).toHaveProperty('dismissAll');
      expect(result.current).toHaveProperty('update');
    });

    it('should return functions for all methods', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.showSuccess).toBe('function');
      expect(typeof result.current.showError).toBe('function');
      expect(typeof result.current.showWarning).toBe('function');
      expect(typeof result.current.showInfo).toBe('function');
      expect(typeof result.current.showLoading).toBe('function');
      expect(typeof result.current.showConfirm).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
      expect(typeof result.current.dismissAll).toBe('function');
      expect(typeof result.current.update).toBe('function');
    });
  });
});
