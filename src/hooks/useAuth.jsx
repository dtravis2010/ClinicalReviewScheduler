import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Simple password for supervisor login
const SUPERVISOR_PASSWORD = '1234';

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if already logged in (from sessionStorage)
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('supervisorLoggedIn') === 'true';
    setIsSupervisor(isLoggedIn);
    setLoading(false);
  }, []);

  async function loginAsSupervisor(password) {
    if (password === SUPERVISOR_PASSWORD) {
      sessionStorage.setItem('supervisorLoggedIn', 'true');
      setIsSupervisor(true);
      return { success: true };
    } else {
      throw new Error('Invalid password');
    }
  }

  async function logout() {
    sessionStorage.removeItem('supervisorLoggedIn');
    setIsSupervisor(false);
  }

  const value = {
    currentUser: isSupervisor ? { role: 'supervisor' } : null,
    loginAsSupervisor,
    logout,
    isSupervisor,
    isFirebaseConfigured: true,
    firebaseConfigError: null,
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
