import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAsSupervisor } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAsSupervisor(password);
      navigate('/supervisor');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-thr-blue-500 to-thr-green-500 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <Lock className="w-8 h-8 text-thr-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Clinical Review Scheduler
          </h1>
          <p className="text-thr-blue-100">Supervisor Login</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter supervisor password"
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Default password: 1234
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Logging in...' : 'Login as Supervisor'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/schedule')}
              className="btn-outline w-full"
            >
              View Published Schedule (No Login Required)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-white text-sm">
          <p>Healthcare Professional Scheduling System</p>
        </div>
      </div>
    </div>
  );
}
