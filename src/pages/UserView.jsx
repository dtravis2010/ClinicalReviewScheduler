import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../utils/logger';
import { Calendar, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import ScheduleGrid from '../components/ScheduleGrid';
import { ScheduleSkeleton } from '../components/Skeleton';
import ThemeToggle from '../components/ThemeToggle';
import { formatDateRange } from '../utils/scheduleUtils';

export default function UserView() {
  const [schedule, setSchedule] = useState(null);
  const [publishedSchedules, setPublishedSchedules] = useState([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const timeoutIds = new Set();

    // Helper function to create a timeout promise with cleanup tracking
    function createTimeoutPromise(ms = 10000) {
      let timeoutId;
      const promise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          timeoutIds.delete(timeoutId);
          reject(new Error('Request timed out'));
        }, ms);
        timeoutIds.add(timeoutId);
      });

      return {
        promise,
        clear: () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutIds.delete(timeoutId);
          }
        }
      };
    }

    async function fetchData() {
      if (!db) {
        if (isMounted) {
          setError('Database connection not available');
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch employees and entities in parallel with schedules
        const [employeesSnapshot, entitiesSnapshot] = await Promise.all([
          getDocs(collection(db, 'employees')),
          getDocs(collection(db, 'entities'))
        ]);

        if (isMounted) {
          setEmployees(employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setEntities(entitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        const schedulesRef = collection(db, 'schedules');
        let allPublishedSchedules = [];

        // Try the optimized query first (requires composite index)
        try {
          const publishedQuery = query(
            schedulesRef,
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc'),
            limit(50) // Limit to most recent 50 published schedules
          );

          const timeout = createTimeoutPromise();
          const snapshot = await Promise.race([getDocs(publishedQuery), timeout.promise]);
          timeout.clear();
          
          allPublishedSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (indexError) {
          // If the composite index query fails, fall back to simpler query
          logger.warn('Composite index query failed, using fallback:', indexError.message);

          // Fallback: get recent schedules and filter in memory
          const fallbackQuery = query(
            schedulesRef,
            orderBy('createdAt', 'desc'),
            limit(50) // Get recent schedules for navigation
          );

          const fallbackTimeout = createTimeoutPromise();
          const allSnapshots = await Promise.race([getDocs(fallbackQuery), fallbackTimeout.promise]);
          fallbackTimeout.clear();

          // Find all published schedules
          allPublishedSchedules = allSnapshots.docs
            .filter(doc => doc.data().status === 'published')
            .map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // Fallback for schedules created before "status" was added
        if (allPublishedSchedules.length === 0) {
          const legacyQuery = query(
            schedulesRef,
            orderBy('createdAt', 'desc'),
            limit(10)
          );

          const legacyTimeout = createTimeoutPromise();
          const legacySnapshot = await Promise.race([getDocs(legacyQuery), legacyTimeout.promise]);
          legacyTimeout.clear();
          
          allPublishedSchedules = legacySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        if (isMounted) {
          setPublishedSchedules(allPublishedSchedules);
          if (allPublishedSchedules.length > 0) {
            setSchedule(allPublishedSchedules[0]);
            setCurrentScheduleIndex(0);
          } else {
            setSchedule(null);
          }
        }
      } catch (error) {
        if (isMounted) {
          logger.error('Error loading schedules:', error);
          setError(error.message || 'Failed to load schedules');
        }
      } finally {
        // Clear all timeouts
        timeoutIds.forEach(id => clearTimeout(id));
        timeoutIds.clear();

        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
      // Clear all tracked timeouts on unmount
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds.clear();
    };
  }, []);

  if (loading) {
    return <ScheduleSkeleton />;
  }

  const handlePreviousSchedule = () => {
    if (currentScheduleIndex < publishedSchedules.length - 1) {
      const newIndex = currentScheduleIndex + 1;
      setCurrentScheduleIndex(newIndex);
      setSchedule(publishedSchedules[newIndex]);
    }
  };

  const handleNextSchedule = () => {
    if (currentScheduleIndex > 0) {
      const newIndex = currentScheduleIndex - 1;
      setCurrentScheduleIndex(newIndex);
      setSchedule(publishedSchedules[newIndex]);
    }
  };

  const isOldestSchedule = currentScheduleIndex >= publishedSchedules.length - 1;
  const isNewestSchedule = currentScheduleIndex <= 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-thr-blue-500 dark:text-thr-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Clinical Review Schedule
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Published Schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-200 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 dark:focus:ring-offset-gray-800"
                aria-label="Supervisor login"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm font-medium">Supervisor Login</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="card dark:bg-gray-800 dark:border-gray-700 text-center py-12" role="alert" aria-live="assertive">
            <Calendar className="w-16 h-16 text-red-400 dark:text-red-600 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Unable to Load Schedule
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There was a problem connecting to the database.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {error}
            </p>
          </div>
        ) : schedule ? (
          <div>
            <div className="mb-6 card dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {schedule.name || 'Current Schedule'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDateRange(schedule.startDate, schedule.endDate, true)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    Published
                  </span>
                  {publishedSchedules.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePreviousSchedule}
                        disabled={isOldestSchedule}
                        className={`p-2 rounded-xl transition-colors ${
                          isOldestSchedule
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'bg-thr-blue-100 dark:bg-thr-blue-900/30 text-thr-blue-600 dark:text-thr-blue-400 hover:bg-thr-blue-200 dark:hover:bg-thr-blue-900/50'
                        }`}
                        aria-label="Previous (older) schedule"
                        title="Previous (older) schedule"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {currentScheduleIndex + 1} of {publishedSchedules.length}
                      </span>
                      <button
                        onClick={handleNextSchedule}
                        disabled={isNewestSchedule}
                        className={`p-2 rounded-xl transition-colors ${
                          isNewestSchedule
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'bg-thr-blue-100 dark:bg-thr-blue-900/30 text-thr-blue-600 dark:text-thr-blue-400 hover:bg-thr-blue-200 dark:hover:bg-thr-blue-900/50'
                        }`}
                        aria-label="Next (newer) schedule"
                        title="Next (newer) schedule"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <ScheduleGrid 
              schedule={schedule} 
              employees={employees}
              entities={entities}
              readOnly={true} 
            />
          </div>
        ) : (
          <div className="card dark:bg-gray-800 dark:border-gray-700 text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Schedule Published
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              The supervisor has not published a schedule yet.
              Please check back later.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
