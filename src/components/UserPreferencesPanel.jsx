/**
 * User Preferences Panel
 * Settings panel for managing user preferences
 */

import { useState } from 'react';
import { Settings, Monitor, Moon, Sun, Volume2, VolumeX, Accessibility, Keyboard } from 'lucide-react';
import PropTypes from 'prop-types';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useTheme } from '../contexts/ThemeContext';

export default function UserPreferencesPanel() {
  const { preferences, updatePreference, loading } = useUserPreferences();
  const { theme, toggleTheme } = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);

  if (loading || !preferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 rounded-xl border-2 border-thr-blue-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const handleToggle = async (key, value) => {
    try {
      await updatePreference(key, value);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="p-4 bg-thr-green-50 dark:bg-thr-green-900/20 border border-thr-green-200 dark:border-thr-green-800 rounded-lg animate-fade-in">
          <p className="text-sm text-thr-green-700 dark:text-thr-green-300">
            ✓ Preferences saved successfully
          </p>
        </div>
      )}

      {/* Display Preferences */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-thr-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Display
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Customize your viewing experience
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              )}
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Theme</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Toggle
            </button>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Animations</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enable smooth transitions and effects
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.display?.animations ?? true}
                onChange={(e) => handleToggle('display.animations', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thr-blue-300 dark:peer-focus:ring-thr-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-thr-blue-600"></div>
            </label>
          </div>

          {/* Tooltips */}
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Tooltips</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Show helpful hints on hover
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.display?.tooltips ?? true}
                onChange={(e) => handleToggle('display.tooltips', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thr-blue-300 dark:peer-focus:ring-thr-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-thr-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage how you receive updates
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Browser Notifications */}
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Browser Notifications</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Receive desktop notifications
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications?.browser ?? true}
                onChange={(e) => handleToggle('notifications.browser', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thr-blue-300 dark:peer-focus:ring-thr-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-thr-blue-600"></div>
            </label>
          </div>

          {/* Schedule Changes */}
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Schedule Changes</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Notify when schedules are updated
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications?.scheduleChanges ?? true}
                onChange={(e) => handleToggle('notifications.scheduleChanges', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thr-blue-300 dark:peer-focus:ring-thr-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-thr-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-green-500/10 to-thr-green-500/5 flex items-center justify-center">
            <Accessibility className="w-5 h-5 text-thr-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Accessibility
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Customize for better usability
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Reduced Motion</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Minimize animations and movement
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.accessibility?.reducedMotion ?? false}
                onChange={(e) => handleToggle('accessibility.reducedMotion', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thr-blue-300 dark:peer-focus:ring-thr-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-thr-blue-600"></div>
            </label>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">High Contrast</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Increase color contrast for better visibility
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.accessibility?.highContrast ?? false}
                onChange={(e) => handleToggle('accessibility.highContrast', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thr-blue-300 dark:peer-focus:ring-thr-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-thr-blue-600"></div>
            </label>
          </div>

          {/* Large Text */}
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Large Text</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Increase text size throughout the app
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.accessibility?.largeText ?? false}
                onChange={(e) => handleToggle('accessibility.largeText', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thr-blue-300 dark:peer-focus:ring-thr-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-thr-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 flex items-center justify-center">
            <Keyboard className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Keyboard Shortcuts
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enable keyboard navigation
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Enable Shortcuts</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Use keyboard shortcuts for common actions
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.keyboard?.enabled ?? true}
              onChange={(e) => handleToggle('keyboard.enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-thr-blue-300 dark:peer-focus:ring-thr-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-thr-blue-600"></div>
          </label>
        </div>

        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Press <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">?</kbd> to view all keyboard shortcuts
          </p>
        </div>
      </div>
    </div>
  );
}

UserPreferencesPanel.propTypes = {
  // No props needed
};
