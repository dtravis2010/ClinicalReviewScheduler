import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SupervisorDashboard from './pages/SupervisorDashboard';
import UserView from './pages/UserView';
import ConfigurationError from './components/ConfigurationError';
import './App.css';

function AppContent() {
  const { isFirebaseConfigured, firebaseConfigError } = useAuth();

  if (!isFirebaseConfigured) {
    return <ConfigurationError error={firebaseConfigError} />;
  }

  return (
    <Router basename="/ClinicalReviewScheduler">
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/supervisor" element={<SupervisorDashboard />} />
          <Route path="/schedule" element={<UserView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
