/**
 * User Preferences Service
 * Manages user settings and preferences with localStorage fallback
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../utils/logger';

const DEFAULT_PREFERENCES = {
  theme: 'light',
  dashboardLayout: 'default',
  dateRangePreset: 'month',
  notifications: {
    email: true,
    browser: true,
    scheduleChanges: true,
    assignments: true,
  },
  display: {
    density: 'comfortable', // compact, comfortable, spacious
    animations: true,
    tooltips: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
  },
  keyboard: {
    enabled: true,
    showShortcuts: true,
  },
  dashboardWidgets: {
    stats: { visible: true, order: 0 },
    recentActivity: { visible: true, order: 1 },
    upcomingSchedules: { visible: true, order: 2 },
    workload: { visible: true, order: 3 },
  },
};

class UserPreferencesService {
  constructor() {
    this.cache = null;
    this.listeners = new Set();
  }

  /**
   * Load user preferences from Firestore or localStorage
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async loadPreferences(userId) {
    try {
      if (!userId) {
        return this.getLocalPreferences();
      }

      const docRef = doc(db, 'userPreferences', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const preferences = { ...DEFAULT_PREFERENCES, ...docSnap.data() };
        this.cache = preferences;
        this.notifyListeners(preferences);
        return preferences;
      }

      // Initialize with defaults
      await this.savePreferences(userId, DEFAULT_PREFERENCES);
      return DEFAULT_PREFERENCES;
    } catch (error) {
      logger.error('Error loading preferences:', error);
      return this.getLocalPreferences();
    }
  }

  /**
   * Save user preferences to Firestore and localStorage
   * @param {string} userId - User ID
   * @param {Object} preferences - Preferences object
   * @returns {Promise<void>}
   */
  async savePreferences(userId, preferences) {
    try {
      const mergedPreferences = { ...DEFAULT_PREFERENCES, ...preferences };

      if (userId) {
        const docRef = doc(db, 'userPreferences', userId);
        await setDoc(docRef, {
          ...mergedPreferences,
          updatedAt: new Date(),
        });
      }

      // Always save to localStorage as backup
      localStorage.setItem('userPreferences', JSON.stringify(mergedPreferences));
      this.cache = mergedPreferences;
      this.notifyListeners(mergedPreferences);
    } catch (error) {
      logger.error('Error saving preferences:', error);
      throw error;
    }
  }

  /**
   * Update specific preference
   * @param {string} userId - User ID
   * @param {string} key - Preference key (supports nested keys with dot notation)
   * @param {*} value - New value
   * @returns {Promise<void>}
   */
  async updatePreference(userId, key, value) {
    try {
      const currentPrefs = this.cache || await this.loadPreferences(userId);
      const updatedPrefs = this.setNestedValue({ ...currentPrefs }, key, value);
      await this.savePreferences(userId, updatedPrefs);
    } catch (error) {
      logger.error('Error updating preference:', error);
      throw error;
    }
  }

  /**
   * Get local preferences from localStorage
   * @returns {Object} Preferences from localStorage or defaults
   */
  getLocalPreferences() {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.error('Error reading local preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  /**
   * Subscribe to preference changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of preference changes
   * @param {Object} preferences - Updated preferences
   */
  notifyListeners(preferences) {
    this.listeners.forEach(callback => {
      try {
        callback(preferences);
      } catch (error) {
        logger.error('Error in preference listener:', error);
      }
    });
  }

  /**
   * Set nested value using dot notation
   * @param {Object} obj - Object to update
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   * @returns {Object} Updated object
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    // Guard against prototype pollution
    if (lastKey === '__proto__' || lastKey === 'constructor' || lastKey === 'prototype') {
      throw new Error('Invalid preference key');
    }
    
    const target = keys.reduce((acc, key) => {
      // Guard against prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new Error('Invalid preference key');
      }
      
      if (!acc[key] || typeof acc[key] !== 'object') {
        acc[key] = {};
      }
      return acc[key];
    }, obj);
    
    target[lastKey] = value;
    return obj;
  }

  /**
   * Reset preferences to defaults
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async resetPreferences(userId) {
    await this.savePreferences(userId, DEFAULT_PREFERENCES);
  }

  /**
   * Apply accessibility preferences to document
   * @param {Object} accessibility - Accessibility settings
   */
  applyAccessibilitySettings(accessibility) {
    const root = document.documentElement;

    // Reduced motion
    if (accessibility.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // High contrast
    if (accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (accessibility.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
  }
}

export const userPreferencesService = new UserPreferencesService();
export default userPreferencesService;
