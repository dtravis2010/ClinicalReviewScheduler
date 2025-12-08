import { vi } from 'vitest';

/**
 * Mock Firestore document snapshot
 */
export const createMockDocSnapshot = (id, data) => ({
  id,
  data: () => data,
  exists: () => true
});

/**
 * Mock Firestore query snapshot
 */
export const createMockQuerySnapshot = (docs) => ({
  docs: docs.map(({ id, data }) => createMockDocSnapshot(id, data)),
  empty: docs.length === 0,
  size: docs.length
});

/**
 * Mock Firestore operations
 */
export const mockFirestoreOperations = () => {
  const mockData = new Map();

  return {
    getDocs: vi.fn(async (query) => {
      // Return all documents for the collection
      const docs = Array.from(mockData.values());
      return createMockQuerySnapshot(docs);
    }),

    getDoc: vi.fn(async (docRef) => {
      const data = mockData.get(docRef.id);
      if (data) {
        return createMockDocSnapshot(docRef.id, data);
      }
      return { exists: () => false };
    }),

    addDoc: vi.fn(async (collectionRef, data) => {
      const id = `mock-id-${Date.now()}-${Math.random()}`;
      mockData.set(id, data);
      return { id };
    }),

    updateDoc: vi.fn(async (docRef, data) => {
      const existing = mockData.get(docRef.id) || {};
      mockData.set(docRef.id, { ...existing, ...data });
    }),

    deleteDoc: vi.fn(async (docRef) => {
      mockData.delete(docRef.id);
    }),

    setDoc: vi.fn(async (docRef, data) => {
      mockData.set(docRef.id, data);
    }),

    // Helper to seed mock data
    seedData: (id, data) => {
      mockData.set(id, data);
    },

    // Helper to clear all mock data
    clearData: () => {
      mockData.clear();
    },

    // Helper to get all mock data
    getAllData: () => {
      return Array.from(mockData.entries()).map(([id, data]) => ({ id, data }));
    }
  };
};

/**
 * Mock Firebase Auth operations
 */
export const mockAuthOperations = () => {
  let currentUser = null;

  return {
    signInWithEmailAndPassword: vi.fn(async (auth, email, password) => {
      currentUser = {
        uid: 'mock-user-id',
        email,
        emailVerified: true
      };
      return { user: currentUser };
    }),

    signOut: vi.fn(async () => {
      currentUser = null;
    }),

    onAuthStateChanged: vi.fn((auth, callback) => {
      callback(currentUser);
      return () => {}; // Unsubscribe function
    }),

    setPersistence: vi.fn(async () => {}),

    // Helper to set current user
    setCurrentUser: (user) => {
      currentUser = user;
    },

    // Helper to get current user
    getCurrentUser: () => currentUser
  };
};

/**
 * Mock serverTimestamp
 */
export const mockServerTimestamp = () => ({
  serverTimestamp: vi.fn(() => new Date())
});

/**
 * Create a complete Firebase mock
 */
export const createFirebaseMock = () => {
  const firestore = mockFirestoreOperations();
  const auth = mockAuthOperations();
  const timestamp = mockServerTimestamp();

  return {
    ...firestore,
    ...auth,
    ...timestamp,
    
    // Reset all mocks
    resetAll: () => {
      firestore.clearData();
      auth.setCurrentUser(null);
      vi.clearAllMocks();
    }
  };
};
