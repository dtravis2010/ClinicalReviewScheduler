import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  it('should initialize with no cell focused (-1, -1)', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        rowCount: 5,
        colCount: 5,
        onActivate: vi.fn(),
      })
    );

    // Initially no cell is focused until user interaction
    expect(result.current.focusedCell).toEqual({ row: -1, col: -1 });
  });

  it('should move focus down with ArrowDown', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        rowCount: 5,
        colCount: 5,
        onActivate: vi.fn(),
      })
    );

    act(() => {
      result.current.moveFocus(1, 0);
    });

    expect(result.current.focusedCell).toEqual({ row: 1, col: 0 });
  });

  it('should move focus right with ArrowRight', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        rowCount: 5,
        colCount: 5,
        onActivate: vi.fn(),
      })
    );

    act(() => {
      result.current.moveFocus(0, 1);
    });

    expect(result.current.focusedCell).toEqual({ row: 0, col: 1 });
  });

  it('should not move focus beyond grid boundaries', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        rowCount: 3,
        colCount: 3,
        onActivate: vi.fn(),
      })
    );

    // Try to move beyond bottom
    act(() => {
      result.current.moveFocus(5, 0);
    });

    expect(result.current.focusedCell).toEqual({ row: 2, col: 0 });

    // Try to move beyond right
    act(() => {
      result.current.moveFocus(0, 5);
    });

    expect(result.current.focusedCell).toEqual({ row: 0, col: 2 });
  });

  it('should not move focus to negative coordinates', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        rowCount: 5,
        colCount: 5,
        onActivate: vi.fn(),
      })
    );

    // First set focus to a valid position
    act(() => {
      result.current.moveFocus(2, 2);
    });
    expect(result.current.focusedCell).toEqual({ row: 2, col: 2 });

    // Try to move to negative row - should clamp to 0
    act(() => {
      result.current.moveFocus(-1, 0);
    });

    expect(result.current.focusedCell).toEqual({ row: 0, col: 0 });

    // Try to move to negative column - should clamp to 0
    act(() => {
      result.current.moveFocus(0, -1);
    });

    expect(result.current.focusedCell).toEqual({ row: 0, col: 0 });
  });

  it('should generate unique cell IDs', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        rowCount: 5,
        colCount: 5,
        onActivate: vi.fn(),
      })
    );

    const id1 = result.current.getCellId(0, 0);
    const id2 = result.current.getCellId(1, 2);

    expect(id1).toBe('cell-0-0');
    expect(id2).toBe('cell-1-2');
    expect(id1).not.toBe(id2);
  });

  it('should correctly identify focused cell', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        rowCount: 5,
        colCount: 5,
        onActivate: vi.fn(),
      })
    );

    // Initially no cell is focused
    expect(result.current.isCellFocused(0, 0)).toBe(false);
    expect(result.current.isCellFocused(1, 1)).toBe(false);

    // Move focus to (0, 0)
    act(() => {
      result.current.moveFocus(0, 0);
    });

    expect(result.current.isCellFocused(0, 0)).toBe(true);
    expect(result.current.isCellFocused(1, 1)).toBe(false);

    // Move focus to (1, 1)
    act(() => {
      result.current.moveFocus(1, 1);
    });

    expect(result.current.isCellFocused(0, 0)).toBe(false);
    expect(result.current.isCellFocused(1, 1)).toBe(true);
  });

  it('should handle disabled state', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        rowCount: 5,
        colCount: 5,
        onActivate: vi.fn(),
        enabled: false,
      })
    );

    // Focus should still work programmatically
    act(() => {
      result.current.moveFocus(2, 2);
    });

    expect(result.current.focusedCell).toEqual({ row: 2, col: 2 });
  });

  it('should navigate through entire grid', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        rowCount: 3,
        colCount: 3,
        onActivate: vi.fn(),
      })
    );

    // Navigate to bottom-right corner
    act(() => {
      result.current.moveFocus(2, 2);
    });

    expect(result.current.focusedCell).toEqual({ row: 2, col: 2 });

    // Navigate back to top-left
    act(() => {
      result.current.moveFocus(0, 0);
    });

    expect(result.current.focusedCell).toEqual({ row: 0, col: 0 });
  });
});
