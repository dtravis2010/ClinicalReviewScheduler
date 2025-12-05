import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-thr-blue-500 to-thr-green-500 flex items-center justify-center px-4">
      <div className="max-w-3xl w-full grid md:grid-cols-2 gap-6">
        <div className="bg-white/10 border border-white/20 rounded-2xl p-8 text-white shadow-xl backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6" />
            <h2 className="text-2xl font-bold">View Schedule</h2>
          </div>
          <p className="text-thr-blue-50 mb-6 text-sm">
            Browse the current published clinical review schedule. No login required.
          </p>
          <button
            onClick={() => navigate('/schedule')}
            className="w-full bg-white text-thr-blue-600 font-semibold py-3 rounded-xl shadow hover:bg-thr-blue-50 transition-colors"
          >
            Continue as User
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4 text-thr-blue-600">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="text-2xl font-bold text-gray-900">Supervisor Access</h2>
          </div>
          <p className="text-gray-600 mb-6 text-sm">
            Manage employees, configure DAR defaults, and publish schedules.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-thr-blue-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-thr-blue-700 transition-colors"
          >
            Continue as Supervisor
          </button>
          <p className="text-xs text-gray-500 mt-3 text-center">Password required: 123456</p>
        </div>
      </div>
    </div>
  );
}
