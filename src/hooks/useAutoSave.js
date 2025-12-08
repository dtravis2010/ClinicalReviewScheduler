import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../utils/logger';

/**
 * Auto-save hook with debouncing
 * @param {Object} data - Data to auto-save
 * @param {Function} saveFunction - Function to call for saving
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Debounce delay in milliseconds (default: 2000)
 * @param {boolean} options.enabled - Whether auto-save is enabled (default: true)
 * @returns {Object} Auto-save state and controls
 */
export function useAutoSave(data, saveFunction, options = {}) {
  const { delay = 2000, enabled = true } = options;
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(null);
  const isMountedRef = useRef(true);

  // Initialize previous data on mount
  useEffect(() => {
    if (previousDataRef.current === null && data) {
      previousDataRef.current = JSON.stringify(data);
    }
  }, []);

  // Detect data changes
  const hasChanged = useCallback(() => {
    if (!data || previousDataRef.current === null) return false;
    
    try {
      const currentData = JSON.stringify(data);
      return currentData !== previousDataRef.current;
    } catch (err) {
      logger.error('Error comparing data for auto-save:', err);
      return false;
    }
  }, [data]);

  // Force save function
  const forceSave = useCallback(async () => {
    if (!saveFunction || !data) return;

    setIsSaving(true);
    setError(null);

    try {
      await saveFunction(data);
      
      if (isMountedRef.current) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        previousDataRef.current = JSON.stringify(data);
        logger.info('Auto-save completed successfully');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to save');
        logger.error('Auto-save failed:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [data, saveFunction]);

  // Auto-save effect with debouncing
  useEffect(() => {
    if (!enabled || !saveFunction || !data) return;

    // Check if data has changed
    if (hasChanged()) {
      setHasUnsavedChanges(true);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(() => {
        forceSave();
      }, delay);
    }

    // Cleanup timeout on unmount or data change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, delay, hasChanged, forceSave, saveFunction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    error,
    hasUnsavedChanges,
    forceSave
  };
}
