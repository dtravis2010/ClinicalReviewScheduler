import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { logger } from '../utils/logger';

/**
 * Auto-save hook with debouncing
 * @param {Object} data - Data to auto-save
 * @param {Function} saveFunction - Function to call for saving
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Debounce delay in milliseconds (default: 2000)
 * @param {boolean} options.enabled - Whether auto-save is enabled (default: true)
 * @param {*} options.resetKey - Reset key to re-initialize auto-save state when changed
 * @returns {Object} Auto-save state and controls
 */
export function useAutoSave(data, saveFunction, options = {}) {
  const { delay = 2000, enabled = true, resetKey } = options;
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(null);
  const isMountedRef = useRef(true);

  const serializedData = useMemo(() => {
    if (!data) return null;
    
    try {
      return JSON.stringify(data);
    } catch (err) {
      logger.error('Error serializing data for auto-save:', err);
      return null;
    }
  }, [data]);

  // Initialize previous data on mount
  useEffect(() => {
    if (previousDataRef.current === null && serializedData !== null) {
      previousDataRef.current = serializedData;
    }
  }, [serializedData]);

  // Reset auto-save state when a reset key changes (e.g., switching schedules)
  useEffect(() => {
    if (resetKey === undefined) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    previousDataRef.current = serializedData;
    setIsSaving(false);
    setLastSaved(null);
    setError(null);
    setHasUnsavedChanges(false);
  }, [resetKey, serializedData]);

  // Detect data changes
  const hasChanged = useCallback(() => {
    if (!serializedData || previousDataRef.current === null) return false;
    
    return serializedData !== previousDataRef.current;
  }, [serializedData]);

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
        previousDataRef.current = serializedData;
        logger.info('Auto-save completed successfully');
      }
    } catch (err) {
      if (isMountedRef.current) {
        // P0-4: Detect session expiry and save draft to localStorage
        const isAuthError = err.code === 'permission-denied' ||
                           err.code === 'unauthenticated' ||
                           err.message?.toLowerCase().includes('auth') ||
                           err.message?.toLowerCase().includes('permission');

        if (isAuthError) {
          // Save draft to localStorage as backup
          try {
            const draftKey = `draft_${resetKey || 'schedule'}`;
            localStorage.setItem(draftKey, serializedData);
            localStorage.setItem(`${draftKey}_timestamp`, new Date().toISOString());
            logger.warn('Session expired - draft saved to localStorage');

            setError({
              type: 'auth',
              message: 'Session expired. Your changes have been saved locally. Please re-login to save to the server.',
              canRecover: true
            });
          } catch (storageErr) {
            logger.error('Failed to save draft to localStorage:', storageErr);
            setError({
              type: 'auth',
              message: 'Session expired and failed to save draft locally. Please re-login.',
              canRecover: false
            });
          }
        } else {
          setError({
            type: 'save',
            message: err.message || 'Failed to save',
            canRecover: false
          });
        }

        logger.error('Auto-save failed:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [data, saveFunction, serializedData]);

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
