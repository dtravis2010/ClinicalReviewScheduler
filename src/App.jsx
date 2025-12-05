import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import SupervisorDashboard from './pages/SupervisorDashboard';
import UserView from './pages/UserView';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router basename="/ClinicalReviewScheduler">
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/schedule" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/supervisor" element={<SupervisorDashboard />} />
            <Route path="/schedule" element={<UserView />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
