/**
 * Keyboard Shortcuts Panel
 * Displays available keyboard shortcuts and handles shortcut activation
 */

import { useState, useEffect } from 'react';
import { X, Keyboard, Search } from 'lucide-react';
import PropTypes from 'prop-types';

const SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['Alt', 'S'], description: 'Go to Schedule' },
      { keys: ['Alt', 'A'], description: 'Go to Analytics' },
      { keys: ['Alt', 'P'], description: 'Go to Productivity' },
      { keys: ['Alt', 'I'], description: 'Go to Insights' },
      { keys: ['Alt', 'H'], description: 'Go to Home' },
    ],
  },
  {
    category: 'Schedule Actions',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save Schedule', mac: ['⌘', 'S'] },
      { keys: ['Ctrl', 'N'], description: 'New Schedule', mac: ['⌘', 'N'] },
      { keys: ['Ctrl', 'E'], description: 'Export Schedule', mac: ['⌘', 'E'] },
      { keys: ['Ctrl', 'P'], description: 'Print/PDF', mac: ['⌘', 'P'] },
      { keys: ['Ctrl', 'Z'], description: 'Undo', mac: ['⌘', 'Z'] },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo', mac: ['⌘', '⇧', 'Z'] },
    ],
  },
  {
    category: 'UI Controls',
    shortcuts: [
      { keys: ['?'], description: 'Show Keyboard Shortcuts' },
      { keys: ['Esc'], description: 'Close Dialog/Modal' },
      { keys: ['Ctrl', 'K'], description: 'Search', mac: ['⌘', 'K'] },
      { keys: ['Alt', 'T'], description: 'Toggle Theme' },
      { keys: ['Alt', 'F'], description: 'Toggle Filters' },
    ],
  },
  {
    category: 'Accessibility',
    shortcuts: [
      { keys: ['Tab'], description: 'Navigate Forward' },
      { keys: ['Shift', 'Tab'], description: 'Navigate Backward' },
      { keys: ['Enter'], description: 'Activate Element' },
      { keys: ['Space'], description: 'Select/Toggle' },
      { keys: ['Arrow Keys'], description: 'Navigate Lists' },
    ],
  },
];

export default function KeyboardShortcuts({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect Mac OS
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredShortcuts = SHORTCUTS.map(category => ({
    ...category,
    shortcuts: category.shortcuts.filter(
      shortcut =>
        shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shortcut.keys.some(key => key.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
  })).filter(category => category.shortcuts.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-thr-blue-500" aria-hidden="true" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Quick reference for keyboard navigation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close shortcuts panel"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-thr-blue-500"
              aria-label="Search keyboard shortcuts"
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No shortcuts found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredShortcuts.map((category) => (
                <div key={category.category}>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, idx) => {
                      const keys = isMac && shortcut.mac ? shortcut.mac : shortcut.keys;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <span className="text-slate-700 dark:text-slate-300">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {keys.map((key, keyIdx) => (
                              <kbd
                                key={keyIdx}
                                className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-sm min-w-[2rem] text-center"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 rounded">?</kbd> to show this panel again
          </p>
        </div>
      </div>
    </div>
  );
}

KeyboardShortcuts.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
