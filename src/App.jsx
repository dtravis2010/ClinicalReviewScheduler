import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import UserView from './pages/UserView';
import ConfigurationError from './components/ConfigurationError';
import EnhancedErrorBoundary from './components/EnhancedErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import ToastProvider from './components/ToastProvider';
import './App.css';

// Supervisor-facing pages are code-split so the public schedule view
// stays light; each chunk loads on first navigation to its route.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SupervisorDashboard = lazy(() => import('./pages/SupervisorDashboard'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const ProductivityDashboard = lazy(() => import('./pages/ProductivityDashboard'));
const InsightsDashboard = lazy(() => import('./pages/InsightsDashboard'));
const RotationDashboard = lazy(() => import('./pages/RotationDashboard'));
const LandingPage = lazy(() => import('./pages/rotation/LandingPage'));
const RotationEditor = lazy(() => import('./pages/rotation/RotationEditor'));
const TeamRoster = lazy(() => import('./pages/rotation/TeamRoster'));
const TrainingRecord = lazy(() => import('./pages/rotation/TrainingRecord'));
const RulesEditor = lazy(() => import('./pages/rotation/RulesEditor'));
const ClusterRebalance = lazy(() => import('./pages/rotation/ClusterRebalance'));
const FairnessHeatmap = lazy(() => import('./pages/rotation/FairnessHeatmap'));
const ReviewerView = lazy(() => import('./pages/rotation/ReviewerView'));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900" role="status" aria-label="Loading page">
      <div className="w-10 h-10 border-4 border-thr-blue-200 border-t-thr-blue-500 rounded-full animate-spin" aria-hidden="true"></div>
    </div>
  );
}

function AppContent() {
  const { isFirebaseConfigured, firebaseConfigError } = useAuth();

  if (!isFirebaseConfigured) {
    return <ConfigurationError error={firebaseConfigError} />;
  }

  return (
    <Router basename="/ClinicalReviewScheduler">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Suspense fallback={<RouteFallback />}>
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
          {/* Rotation Intelligence — supervisor-facing pages */}
          <Route path="/rotation/overview" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
          <Route path="/rotation/editor/:rotationId" element={<ProtectedRoute><RotationEditor /></ProtectedRoute>} />
          <Route path="/rotation/team" element={<ProtectedRoute><TeamRoster /></ProtectedRoute>} />
          <Route path="/rotation/team/:name" element={<ProtectedRoute><TrainingRecord /></ProtectedRoute>} />
          <Route path="/rotation/rules" element={<ProtectedRoute><RulesEditor /></ProtectedRoute>} />
          <Route path="/rotation/rules/clusters" element={<ProtectedRoute><ClusterRebalance /></ProtectedRoute>} />
          <Route path="/rotation/fairness" element={<ProtectedRoute><FairnessHeatmap /></ProtectedRoute>} />
          {/* Reviewer view — accessible without supervisor auth */}
          <Route path="/rotation/my-rotation" element={<ReviewerView />} />
        </Routes>
        </Suspense>
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
