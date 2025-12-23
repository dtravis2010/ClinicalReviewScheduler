/**
 * useKeyboardShortcuts Hook
 * Manages global keyboard shortcuts
 */

import { useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

export default function useKeyboardShortcuts({
  onShowShortcuts,
  onSave,
  onNew,
  onExport,
  onUndo,
  onRedo,
  onSearch,
  onToggleTheme,
  onToggleFilter,
  enabled = true
}) {
  const handlersRef = useRef({
    onShowShortcuts,
    onSave,
    onNew,
    onExport,
    onUndo,
    onRedo,
    onSearch,
    onToggleTheme,
    onToggleFilter
  });

  // Update refs when handlers change
  useEffect(() => {
    handlersRef.current = {
      onShowShortcuts,
      onSave,
      onNew,
      onExport,
      onUndo,
      onRedo,
      onSearch,
      onToggleTheme,
      onToggleFilter
    };
  }, [onShowShortcuts, onSave, onNew, onExport, onUndo, onRedo, onSearch, onToggleTheme, onToggleFilter]);

  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    // Ignore if user is typing in an input/textarea
    const target = e.target;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow some shortcuts even in input fields
      if (!(e.ctrlKey || e.metaKey)) {
        return;
      }
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    // Show keyboard shortcuts (?)
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      handlersRef.current.onShowShortcuts?.();
      logger.info('Keyboard shortcut: Show shortcuts');
      return;
    }

    // Save (Ctrl/Cmd + S)
    if (modKey && e.key === 's') {
      e.preventDefault();
      handlersRef.current.onSave?.();
      logger.info('Keyboard shortcut: Save');
      return;
    }

    // New (Ctrl/Cmd + N)
    if (modKey && e.key === 'n') {
      e.preventDefault();
      handlersRef.current.onNew?.();
      logger.info('Keyboard shortcut: New');
      return;
    }

    // Export (Ctrl/Cmd + E)
    if (modKey && e.key === 'e') {
      e.preventDefault();
      handlersRef.current.onExport?.();
      logger.info('Keyboard shortcut: Export');
      return;
    }

    // Print/PDF (Ctrl/Cmd + P)
    if (modKey && e.key === 'p') {
      e.preventDefault();
      handlersRef.current.onExport?.();
      logger.info('Keyboard shortcut: Print/PDF');
      return;
    }

    // Undo (Ctrl/Cmd + Z)
    if (modKey && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      handlersRef.current.onUndo?.();
      logger.info('Keyboard shortcut: Undo');
      return;
    }

    // Redo (Ctrl/Cmd + Shift + Z)
    if (modKey && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      handlersRef.current.onRedo?.();
      logger.info('Keyboard shortcut: Redo');
      return;
    }

    // Search (Ctrl/Cmd + K)
    if (modKey && e.key === 'k') {
      e.preventDefault();
      handlersRef.current.onSearch?.();
      logger.info('Keyboard shortcut: Search');
      return;
    }

    // Toggle theme (Alt + T)
    if (e.altKey && e.key === 't') {
      e.preventDefault();
      handlersRef.current.onToggleTheme?.();
      logger.info('Keyboard shortcut: Toggle theme');
      return;
    }

    // Toggle filter (Alt + F)
    if (e.altKey && e.key === 'f') {
      e.preventDefault();
      handlersRef.current.onToggleFilter?.();
      logger.info('Keyboard shortcut: Toggle filter');
      return;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  return {
    enabled
  };
}
