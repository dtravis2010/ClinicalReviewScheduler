import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../utils/logger';
import { Calendar, Lock } from 'lucide-react';
import ScheduleGrid from '../components/ScheduleGrid';
import { ScheduleSkeleton } from '../components/Skeleton';
import ThemeToggle from '../components/ThemeToggle';

export default function UserView() {
  const [schedule, setSchedule] = useState(null);
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
        // Fetch employees and entities in parallel with schedule
        const [employeesSnapshot, entitiesSnapshot] = await Promise.all([
          getDocs(collection(db, 'employees')),
          getDocs(collection(db, 'entities'))
        ]);

        if (isMounted) {
          setEmployees(employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setEntities(entitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        const schedulesRef = collection(db, 'schedules');
        let snapshot = null;

        // Try the optimized query first (requires composite index)
        try {
          const publishedQuery = query(
            schedulesRef,
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );

          const timeout = createTimeoutPromise();
          snapshot = await Promise.race([getDocs(publishedQuery), timeout.promise]);
          timeout.clear();
        } catch (indexError) {
          // If the composite index query fails, fall back to simpler query
          logger.warn('Composite index query failed, using fallback:', indexError.message);

          // Fallback: get recent schedules and filter in memory (limited to avoid performance issues)
          const fallbackQuery = query(
            schedulesRef,
            orderBy('createdAt', 'desc'),
            limit(50) // Limit to recent schedules to avoid fetching too many documents
          );

          const fallbackTimeout = createTimeoutPromise();
          const allSnapshots = await Promise.race([getDocs(fallbackQuery), fallbackTimeout.promise]);
          fallbackTimeout.clear();

          // Find the most recent published schedule
          const publishedDocs = allSnapshots.docs.filter(doc => doc.data().status === 'published');
          if (publishedDocs.length > 0) {
            snapshot = { empty: false, docs: [publishedDocs[0]] };
          } else {
            snapshot = { empty: true, docs: [] };
          }
        }

        // Fallback for schedules created before "status" was added
        if (snapshot.empty) {
          const legacyQuery = query(
            schedulesRef,
            orderBy('createdAt', 'desc'),
            limit(1)
          );

          const legacyTimeout = createTimeoutPromise();
          snapshot = await Promise.race([getDocs(legacyQuery), legacyTimeout.promise]);
          legacyTimeout.clear();
        }

        if (isMounted) {
          if (!snapshot.empty && snapshot.docs?.[0]) {
            setSchedule({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
          } else {
            setSchedule(null);
          }
        }
      } catch (error) {
        if (isMounted) {
          logger.error('Error loading schedule:', error);
          setError(error.message || 'Failed to load schedule');
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
                    {schedule.startDate} - {schedule.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    Published
                  </span>
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
