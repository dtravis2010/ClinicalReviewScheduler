import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../hooks/useAuth.jsx';

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: {
    currentUser: null
  },
  isFirebaseConfigured: true,
  firebaseConfigError: null
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Immediately call callback with null user for tests
    setTimeout(() => callback(null), 0);
    return vi.fn(); // Return unsubscribe function
  }),
  setPersistence: vi.fn(() => Promise.resolve()),
  browserSessionPersistence: 'SESSION'
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should provide auth context', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current).not.toBeUndefined();
        expect(result.current.loginAsSupervisor).toBeDefined();
      });

      expect(result.current.loginAsSupervisor).toBeDefined();
      expect(result.current.logout).toBeDefined();
      expect(result.current.isSupervisor).toBeDefined();
      expect(result.current.isFirebaseConfigured).toBeDefined();
    });

    it('should initialize with null currentUser', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentUser).toBeNull();
      });
    });

    it('should provide loginAsSupervisor function', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(typeof result.current.loginAsSupervisor).toBe('function');
      });
    });

    it('should provide logout function', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(typeof result.current.logout).toBe('function');
      });
    });

    it('should set isSupervisor to false when no user', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSupervisor).toBe(false);
      });
    });

    it('should expose isFirebaseConfigured', async () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isFirebaseConfigured).toBe(true);
      });
    });
  });

  describe('useAuth without provider', () => {
    it('should return undefined when used outside AuthProvider', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toBeUndefined();
    });
  });
});
