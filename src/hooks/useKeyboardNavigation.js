import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for keyboard navigation in a grid structure
 * Supports arrow keys, Home/End, Enter/Space for activation
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.rowCount - Number of rows in the grid
 * @param {number} options.colCount - Number of columns in the grid
 * @param {Function} options.onActivate - Callback when Enter/Space is pressed
 * @param {boolean} options.enabled - Whether keyboard navigation is enabled
 * @returns {Object} Navigation state and handlers
 */
export function useKeyboardNavigation({ rowCount, colCount, onActivate, enabled = true }) {
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });
  const gridRef = useRef(null);

  /**
   * Move focus to a specific cell
   * @param {number} row - Row index
   * @param {number} col - Column index
   */
  const moveFocus = useCallback((row, col) => {
    const newRow = Math.max(0, Math.min(row, rowCount - 1));
    const newCol = Math.max(0, Math.min(col, colCount - 1));
    setFocusedCell({ row: newRow, col: newCol });
  }, [rowCount, colCount]);

  /**
   * Handle keyboard events for grid navigation
   */
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { row, col } = focusedCell;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(row - 1, col);
        break;

      case 'ArrowDown':
        event.preventDefault();
        moveFocus(row + 1, col);
        break;

      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(row, col - 1);
        break;

      case 'ArrowRight':
        event.preventDefault();
        moveFocus(row, col + 1);
        break;

      case 'Home':
        event.preventDefault();
        if (event.ctrlKey) {
          // Ctrl+Home: Go to first cell
          moveFocus(0, 0);
        } else {
          // Home: Go to first column in current row
          moveFocus(row, 0);
        }
        break;

      case 'End':
        event.preventDefault();
        if (event.ctrlKey) {
          // Ctrl+End: Go to last cell
          moveFocus(rowCount - 1, colCount - 1);
        } else {
          // End: Go to last column in current row
          moveFocus(row, colCount - 1);
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onActivate) {
          onActivate(row, col);
        }
        break;

      default:
        break;
    }
  }, [enabled, focusedCell, rowCount, colCount, moveFocus, onActivate]);

  /**
   * Attach keyboard event listener
   */
  useEffect(() => {
    if (!enabled) return;

    const element = gridRef.current;
    if (element) {
      element.addEventListener('keydown', handleKeyDown);
      return () => {
        element.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  /**
   * Get cell ID for ARIA attributes
   */
  const getCellId = useCallback((row, col) => {
    return `cell-${row}-${col}`;
  }, []);

  /**
   * Check if a cell is focused
   */
  const isCellFocused = useCallback((row, col) => {
    return focusedCell.row === row && focusedCell.col === col;
  }, [focusedCell]);

  return {
    gridRef,
    focusedCell,
    moveFocus,
    getCellId,
    isCellFocused,
    handleKeyDown,
  };
}
