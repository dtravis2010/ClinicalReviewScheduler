import { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured, firebaseConfigError } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simple supervisor login - hardcoded for now
  // Email: supervisor@clinical.com
  // Password: 1234
  async function loginAsSupervisor(password) {
    if (!isFirebaseConfigured) {
      throw new Error(firebaseConfigError);
    }
    try {
      // Set session persistence
      await setPersistence(auth, browserSessionPersistence);
      // For now, we'll use a hardcoded email
      const result = await signInWithEmailAndPassword(
        auth,
        'supervisor@clinical.com',
        password
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    if (!isFirebaseConfigured) {
      return;
    }
    return signOut(auth);
  }

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loginAsSupervisor,
    logout,
    isSupervisor: !!currentUser,
    isFirebaseConfigured,
    firebaseConfigError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
