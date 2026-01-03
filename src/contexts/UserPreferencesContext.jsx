/**
 * User Preferences Context
 * Global state management for user preferences
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { userPreferencesService } from '../services/userPreferencesService';
import { logger } from '../utils/logger';

const UserPreferencesContext = createContext();

export function UserPreferencesProvider({ children, userId = null }) {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load preferences on mount or when userId changes
  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await userPreferencesService.loadPreferences(userId);
      setPreferences(prefs);
      
      // Apply accessibility settings
      if (prefs.accessibility) {
        userPreferencesService.applyAccessibilitySettings(prefs.accessibility);
      }
    } catch (error) {
      logger.error('Error loading preferences:', error);
      // Use defaults on error
      setPreferences(userPreferencesService.getLocalPreferences());
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = useCallback(
    async (key, value) => {
      try {
        await userPreferencesService.updatePreference(userId, key, value);
        
        // Update local state
        setPreferences((prev) => {
          const updated = { ...prev };
          const keys = key.split('.');
          
          // Guard against prototype pollution
          const lastKey = keys[keys.length - 1];
          if (lastKey === '__proto__' || lastKey === 'constructor' || lastKey === 'prototype') {
            throw new Error('Invalid preference key');
          }
          
          let target = updated;
          
          for (let i = 0; i < keys.length - 1; i++) {
            const currentKey = keys[i];
            
            // Guard against prototype pollution
            if (currentKey === '__proto__' || currentKey === 'constructor' || currentKey === 'prototype') {
              throw new Error('Invalid preference key');
            }
            
            if (!target[currentKey] || typeof target[currentKey] !== 'object') {
              target[currentKey] = {};
            }
            target = target[currentKey];
          }
          
          target[lastKey] = value;
          
          // Re-apply accessibility settings if changed
          if (key.startsWith('accessibility.')) {
            userPreferencesService.applyAccessibilitySettings(updated.accessibility);
          }
          
          return updated;
        });
      } catch (error) {
        logger.error('Error updating preference:', error);
        throw error;
      }
    },
    [userId]
  );

  const resetPreferences = useCallback(async () => {
    try {
      await userPreferencesService.resetPreferences(userId);
      await loadPreferences();
    } catch (error) {
      logger.error('Error resetting preferences:', error);
      throw error;
    }
  }, [userId]);

  const value = {
    preferences,
    loading,
    updatePreference,
    resetPreferences,
    refreshPreferences: loadPreferences,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

UserPreferencesProvider.propTypes = {
  children: PropTypes.node.isRequired,
  userId: PropTypes.string,
};

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}

export default UserPreferencesContext;
