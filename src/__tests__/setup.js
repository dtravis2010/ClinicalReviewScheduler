import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Firebase to avoid initialization errors in tests
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  isFirebaseConfigured: true,
  firebaseConfigError: null
}));

// Mock environment variables
process.env.VITE_SUPERVISOR_EMAIL = 'supervisor@test.com';
