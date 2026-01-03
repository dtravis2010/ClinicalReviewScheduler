/**
 * Tests for UserPreferencesService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userPreferencesService } from '../../services/userPreferencesService';

// Mock Firestore
vi.mock('../../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

describe('UserPreferencesService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear service cache
    userPreferencesService.cache = null;
  });

  describe('getLocalPreferences', () => {
    it('should return default preferences when localStorage is empty', () => {
      const prefs = userPreferencesService.getLocalPreferences();
      
      expect(prefs).toBeDefined();
      expect(prefs.theme).toBe('light');
      expect(prefs.notifications).toBeDefined();
      expect(prefs.display).toBeDefined();
    });

    it('should merge stored preferences with defaults', () => {
      const customPrefs = { theme: 'dark', custom: 'value' };
      localStorage.setItem('userPreferences', JSON.stringify(customPrefs));
      
      const prefs = userPreferencesService.getLocalPreferences();
      
      expect(prefs.theme).toBe('dark');
      expect(prefs.custom).toBe('value');
      expect(prefs.notifications).toBeDefined(); // Should still have defaults
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('userPreferences', 'invalid json');
      
      const prefs = userPreferencesService.getLocalPreferences();
      
      expect(prefs).toBeDefined();
      expect(prefs.theme).toBe('light');
    });
  });

  describe('setNestedValue', () => {
    it('should set top-level value', () => {
      const obj = { a: 1 };
      const result = userPreferencesService.setNestedValue(obj, 'b', 2);
      
      expect(result.b).toBe(2);
      expect(result.a).toBe(1);
    });

    it('should set nested value', () => {
      const obj = { a: { b: 1 } };
      const result = userPreferencesService.setNestedValue(obj, 'a.c', 2);
      
      expect(result.a.c).toBe(2);
      expect(result.a.b).toBe(1);
    });

    it('should create nested structure if missing', () => {
      const obj = {};
      const result = userPreferencesService.setNestedValue(obj, 'a.b.c', 'value');
      
      expect(result.a.b.c).toBe('value');
    });

    it('should handle deep nesting', () => {
      const obj = {};
      const result = userPreferencesService.setNestedValue(
        obj,
        'level1.level2.level3.level4',
        'deep'
      );
      
      expect(result.level1.level2.level3.level4).toBe('deep');
    });

    it('should prevent prototype pollution via __proto__', () => {
      const obj = {};
      
      expect(() => {
        userPreferencesService.setNestedValue(obj, '__proto__.polluted', 'bad');
      }).toThrow('Invalid preference key');
    });

    it('should prevent prototype pollution via constructor', () => {
      const obj = {};
      
      expect(() => {
        userPreferencesService.setNestedValue(obj, 'constructor.polluted', 'bad');
      }).toThrow('Invalid preference key');
    });

    it('should prevent prototype pollution via nested __proto__', () => {
      const obj = {};
      
      expect(() => {
        userPreferencesService.setNestedValue(obj, 'a.__proto__.polluted', 'bad');
      }).toThrow('Invalid preference key');
    });
  });

  describe('subscribe/notifyListeners', () => {
    it('should notify listeners on preference change', () => {
      const listener = vi.fn();
      
      userPreferencesService.subscribe(listener);
      
      const testPrefs = { theme: 'dark' };
      userPreferencesService.notifyListeners(testPrefs);
      
      expect(listener).toHaveBeenCalledWith(testPrefs);
    });

    it('should allow multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      userPreferencesService.subscribe(listener1);
      userPreferencesService.subscribe(listener2);
      
      const testPrefs = { theme: 'dark' };
      userPreferencesService.notifyListeners(testPrefs);
      
      expect(listener1).toHaveBeenCalledWith(testPrefs);
      expect(listener2).toHaveBeenCalledWith(testPrefs);
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      
      const unsubscribe = userPreferencesService.subscribe(listener);
      unsubscribe();
      
      userPreferencesService.notifyListeners({ theme: 'dark' });
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle errors in listeners gracefully', () => {
      const badListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      
      userPreferencesService.subscribe(badListener);
      userPreferencesService.subscribe(goodListener);
      
      expect(() => {
        userPreferencesService.notifyListeners({ theme: 'dark' });
      }).not.toThrow();
      
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('applyAccessibilitySettings', () => {
    beforeEach(() => {
      // Reset document classes
      document.documentElement.className = '';
    });

    it('should apply reduced motion class', () => {
      userPreferencesService.applyAccessibilitySettings({
        reducedMotion: true,
      });
      
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
    });

    it('should remove reduced motion class when disabled', () => {
      document.documentElement.classList.add('reduce-motion');
      
      userPreferencesService.applyAccessibilitySettings({
        reducedMotion: false,
      });
      
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(false);
    });

    it('should apply high contrast class', () => {
      userPreferencesService.applyAccessibilitySettings({
        highContrast: true,
      });
      
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    });

    it('should apply large text class', () => {
      userPreferencesService.applyAccessibilitySettings({
        largeText: true,
      });
      
      expect(document.documentElement.classList.contains('large-text')).toBe(true);
    });

    it('should apply multiple accessibility settings', () => {
      userPreferencesService.applyAccessibilitySettings({
        reducedMotion: true,
        highContrast: true,
        largeText: true,
      });
      
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
      expect(document.documentElement.classList.contains('large-text')).toBe(true);
    });
  });
});
