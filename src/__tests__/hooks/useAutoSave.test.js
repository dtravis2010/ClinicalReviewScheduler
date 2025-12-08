import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '../../hooks/useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with correct default state', () => {
    const saveFunction = vi.fn();
    const { result } = renderHook(() => 
      useAutoSave({ name: 'test' }, saveFunction)
    );

    expect(result.current.isSaving).toBe(false);
    expect(result.current.lastSaved).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should debounce save calls with 2 second delay', async () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFunction, { delay: 2000 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    // Change data
    rerender({ data: { name: 'test2' } });

    // Should not save immediately
    expect(saveFunction).not.toHaveBeenCalled();
    expect(result.current.hasUnsavedChanges).toBe(true);

    // Advance time by 1 second - should still not save
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(saveFunction).not.toHaveBeenCalled();

    // Advance time by another 1 second - should save now
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();
    });

    expect(saveFunction).toHaveBeenCalledTimes(1);
    expect(saveFunction).toHaveBeenCalledWith({ name: 'test2' });
  });

  it('should reset debounce timer on multiple rapid changes', async () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFunction, { delay: 2000 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    // Make multiple rapid changes
    rerender({ data: { name: 'test2' } });
    act(() => { vi.advanceTimersByTime(1000); });
    
    rerender({ data: { name: 'test3' } });
    act(() => { vi.advanceTimersByTime(1000); });
    
    rerender({ data: { name: 'test4' } });
    act(() => { vi.advanceTimersByTime(1000); });

    // Should not have saved yet
    expect(saveFunction).not.toHaveBeenCalled();

    // Advance final 2 seconds
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();
    });

    // Should only save once with the final value
    expect(saveFunction).toHaveBeenCalledTimes(1);
    expect(saveFunction).toHaveBeenCalledWith({ name: 'test4' });
  });

  it('should update isSaving state during save', async () => {
    let resolveSave;
    const saveFunction = vi.fn(() => new Promise(resolve => { resolveSave = resolve; }));
    
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFunction, { delay: 100 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    // Change data and wait for debounce
    rerender({ data: { name: 'test2' } });
    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    // Should be saving
    expect(result.current.isSaving).toBe(true);

    // Resolve the save
    await act(async () => {
      resolveSave();
    });

    // Should no longer be saving
    expect(result.current.isSaving).toBe(false);
  });

  it('should update lastSaved timestamp on successful save', async () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFunction, { delay: 100 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    expect(result.current.lastSaved).toBe(null);

    // Change data and trigger save
    rerender({ data: { name: 'test2' } });
    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    expect(result.current.lastSaved).toBeInstanceOf(Date);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should set error state on save failure', async () => {
    const saveFunction = vi.fn().mockRejectedValue(new Error('Save failed'));
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFunction, { delay: 100 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    // Change data and trigger save
    rerender({ data: { name: 'test2' } });
    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe('Save failed');
    expect(result.current.isSaving).toBe(false);
  });

  it('should support forceSave to save immediately', async () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFunction, { delay: 2000 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    // Change data
    rerender({ data: { name: 'test2' } });
    expect(result.current.hasUnsavedChanges).toBe(true);

    // Force save immediately
    await act(async () => {
      await result.current.forceSave();
    });

    // Should have saved without waiting for debounce
    expect(saveFunction).toHaveBeenCalledTimes(1);
    expect(saveFunction).toHaveBeenCalledWith({ name: 'test2' });
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should not save when enabled is false', async () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFunction, { delay: 100, enabled: false }),
      { initialProps: { data: { name: 'test1' } } }
    );

    // Change data
    rerender({ data: { name: 'test2' } });
    act(() => { vi.advanceTimersByTime(200); });

    // Should not have saved
    expect(saveFunction).not.toHaveBeenCalled();
  });

  it('should not save when data has not changed', async () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFunction, { delay: 100 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    // Rerender with same data
    rerender({ data: { name: 'test1' } });
    act(() => { vi.advanceTimersByTime(200); });

    // Should not have saved
    expect(saveFunction).not.toHaveBeenCalled();
  });

  it('should detect changes using JSON comparison', async () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFunction, { delay: 100 }),
      { initialProps: { data: { name: 'test', count: 1, nested: { value: 'a' } } } }
    );

    // Change nested property
    rerender({ data: { name: 'test', count: 1, nested: { value: 'b' } } });
    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    expect(saveFunction).toHaveBeenCalledTimes(1);
  });

  it('should cleanup timeout on unmount', () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { unmount, rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFunction, { delay: 2000 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    // Change data
    rerender({ data: { name: 'test2' } });

    // Unmount before save
    unmount();

    // Advance time
    act(() => { vi.advanceTimersByTime(3000); });

    // Should not have saved after unmount
    expect(saveFunction).not.toHaveBeenCalled();
  });
});
