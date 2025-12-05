import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Lock } from 'lucide-react';
import ScheduleGrid from '../components/ScheduleGrid';

export default function UserView() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPublishedSchedule();
  }, []);

  async function loadPublishedSchedule() {
    try {
      const schedulesRef = collection(db, 'schedules');
      const q = query(
        schedulesRef,
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setSchedule({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setSchedule(null);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-thr-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-thr-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Clinical Review Schedule
                </h1>
                <p className="text-sm text-gray-600">Current Published Schedule</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Supervisor Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {schedule ? (
          <div>
            <div className="mb-6 card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {schedule.name || 'Current Schedule'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {schedule.startDate} - {schedule.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Published
                  </span>
                </div>
              </div>
            </div>

            <ScheduleGrid schedule={schedule} readOnly={true} />
          </div>
        ) : (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Schedule Published
            </h3>
            <p className="text-gray-600">
              The supervisor has not published a schedule yet.
              Please check back later.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
