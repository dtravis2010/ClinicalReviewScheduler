import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import SupervisorDashboard from './pages/SupervisorDashboard';
import UserView from './pages/UserView';
import ConfigurationError from './components/ConfigurationError';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import ToastProvider from './components/ToastProvider';
import './App.css';

function AppContent() {
  const { isFirebaseConfigured, firebaseConfigError } = useAuth();

  if (!isFirebaseConfigured) {
    return <ConfigurationError error={firebaseConfigError} />;
  }

  return (
    <Router basename="/ClinicalReviewScheduler">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<Navigate to="/schedule" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/schedule" element={<UserView />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <ToastProvider />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
