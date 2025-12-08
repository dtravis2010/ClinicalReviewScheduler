import { useState, useCallback, useRef, useEffect } from 'react';
import { UndoRedoManager } from '../utils/undoRedoManager';

/**
 * React hook for undo/redo functionality
 * @param {*} initialState - Initial state value
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Maximum number of history items (default: 50)
 * @returns {Object} State and undo/redo controls
 */
export function useUndoRedo(initialState, options = {}) {
  const managerRef = useRef(null);
  
  // Initialize manager on first render
  if (managerRef.current === null) {
    managerRef.current = new UndoRedoManager(initialState, options);
  }

  const [state, setStateInternal] = useState(initialState);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update can undo/redo flags
  const updateFlags = useCallback(() => {
    if (managerRef.current) {
      setCanUndo(managerRef.current.canUndo());
      setCanRedo(managerRef.current.canRedo());
    }
  }, []);

  // Set state with history tracking
  const setState = useCallback((newState) => {
    if (managerRef.current) {
      // Handle function updates
      const resolvedState = typeof newState === 'function' 
        ? newState(managerRef.current.getCurrentState())
        : newState;
      
      managerRef.current.addChange(resolvedState);
      setStateInternal(resolvedState);
      updateFlags();
    }
  }, [updateFlags]);

  // Undo last change
  const undo = useCallback(() => {
    if (managerRef.current && managerRef.current.canUndo()) {
      const previousState = managerRef.current.undo();
      setStateInternal(previousState);
      updateFlags();
    }
  }, [updateFlags]);

  // Redo last undone change
  const redo = useCallback(() => {
    if (managerRef.current && managerRef.current.canRedo()) {
      const nextState = managerRef.current.redo();
      setStateInternal(nextState);
      updateFlags();
    }
  }, [updateFlags]);

  // Clear history
  const clearHistory = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clear();
      updateFlags();
    }
  }, [updateFlags]);

  // Initialize flags
  useEffect(() => {
    updateFlags();
  }, [updateFlags]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory
  };
}
