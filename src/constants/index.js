/**
 * Centralized constants for the Clinical Review Scheduler
 */

// Firebase collection names
export const COLLECTIONS = {
  SCHEDULES: 'schedules',
  EMPLOYEES: 'employees',
  ENTITIES: 'entities',
  SETTINGS: 'settings'
};

// Settings document IDs
export const SETTINGS_DOCS = {
  DAR_CONFIG: 'darConfig'
};

// Schedule status values
export const SCHEDULE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published'
};

// Available employee skills
export const SKILLS = ['DAR', 'Trace', 'CPOE', 'Float'];

// Query limits for pagination
export const QUERY_LIMITS = {
  SCHEDULES: 50,
  HISTORY: 100,
  FALLBACK: 50
};

// Assignment field names
export const ASSIGNMENT_FIELDS = {
  NEW_INCOMING: 'newIncoming',
  CROSS_TRAINING: 'crossTraining',
  DARS: 'dars'
};

// Timeout durations (in milliseconds)
export const TIMEOUTS = {
  FIREBASE_QUERY: 10000,
  AUTH_STATE_CHANGE: 10000
};

// Default values
export const DEFAULTS = {
  DAR_COUNT: 5,
  DAR_CONFIG: {}
};

// Validation constraints
export const VALIDATION = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 6
};

// UI Constants
export const UI = {
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  MAX_ENTITY_CODE_LENGTH: 6 // Maximum length for entity codes (e.g., "THDN", "THA")
};
