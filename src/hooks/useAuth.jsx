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

  async function loginAsSupervisor(password) {
    if (!isFirebaseConfigured) {
      throw new Error(firebaseConfigError);
    }
    try {
      await setPersistence(auth, browserSessionPersistence);

      // Use environment variable for supervisor email
      const supervisorEmail = import.meta.env.VITE_SUPERVISOR_EMAIL || 'supervisor@clinical.com';

      const result = await signInWithEmailAndPassword(
        auth,
        supervisorEmail,
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
    
    // Set a timeout to prevent hanging forever if auth never responds
    const timeoutId = setTimeout(() => {
      console.warn('Auth state change timed out');
      setLoading(false);
    }, 10000);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeoutId);
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    loginAsSupervisor,
    logout,
    isSupervisor: !!currentUser,
    isFirebaseConfigured,
    firebaseConfigError,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
