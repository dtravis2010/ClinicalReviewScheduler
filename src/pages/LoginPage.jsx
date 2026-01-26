import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, AlertCircle, LogIn, Eye } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/atoms/Button';
import FormInput from '../components/FormInput';
import { logger } from '../utils/logger';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAsSupervisor, isFirebaseConfigured, firebaseConfigError } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAsSupervisor(password);
      navigate('/supervisor');
    } catch (err) {
      logger.error('Login error:', err);

      if (!isFirebaseConfigured) {
        setError(firebaseConfigError || 'Firebase is not configured. Please check your environment settings.');
        setLoading(false);
        return;
      }

      const errorCode = err?.code;
      const message =
        errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-login-credentials'
          ? 'Invalid password. Please try again.'
          : 'Unable to log in. Please try again or contact an administrator.';

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-thr-blue-500 to-thr-green-500 dark:from-thr-blue-800 dark:to-thr-green-800 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-full mb-4">
            <Lock className="w-8 h-8 text-thr-blue-500 dark:text-thr-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Clinical Review Scheduler
          </h1>
          <p className="text-thr-blue-100 dark:text-thr-blue-200">Supervisor Login</p>
        </div>

        <div className="card bg-white dark:bg-gray-800 border dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              id="password"
              name="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={true}
              placeholder="Enter supervisor password"
              autoComplete="current-password"
              className="dark:bg-gray-700"
            />

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 animate-shake" role="alert" aria-live="assertive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth={true}
              loading={loading}
              disabled={loading}
              icon={<LogIn className="w-5 h-5" />}
            >
              Login as Supervisor
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => navigate('/schedule')}
              variant="outline"
              fullWidth={true}
              icon={<Eye className="w-5 h-5" />}
            >
              View Published Schedule (No Login Required)
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center text-white dark:text-gray-300 text-sm">
          <p>Healthcare Professional Scheduling System</p>
        </div>
      </div>
    </div>
  );
}
