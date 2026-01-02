import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import LoginPage from './pages/LoginPage';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ProductivityDashboard from './pages/ProductivityDashboard';
import InsightsDashboard from './pages/InsightsDashboard';
import RotationDashboard from './pages/RotationDashboard';
import UserView from './pages/UserView';
import ConfigurationError from './components/ConfigurationError';
import EnhancedErrorBoundary from './components/EnhancedErrorBoundary';
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
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/productivity"
            element={
              <ProtectedRoute>
                <ProductivityDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <InsightsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rotation"
            element={
              <ProtectedRoute>
                <RotationDashboard />
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
    <EnhancedErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <UserPreferencesProvider>
            <AppContent />
            <ToastProvider />
          </UserPreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;
