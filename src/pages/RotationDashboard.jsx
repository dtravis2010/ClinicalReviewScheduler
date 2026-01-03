import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../constants';
import EmployeeRotationView from '../components/EmployeeRotationView';
import { DashboardSkeleton } from '../components/Skeleton';
import { Calendar, ArrowLeft, RotateCcw } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function RotationDashboard() {
  const { currentUser, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lookbackLimit, setLookbackLimit] = useState(10);

  useEffect(() => {
    if (!isSupervisor) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isSupervisor, navigate]);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([loadEmployees(), loadSchedules()]);
    } catch (error) {
      logger.error('Error loading rotation dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    try {
      const employeesRef = collection(db, COLLECTIONS.EMPLOYEES);
      const q = query(employeesRef, orderBy('name'));
      const snapshot = await getDocs(q);
      const employeesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesList);
      logger.info(`Loaded ${employeesList.length} employees`);
    } catch (error) {
      logger.error('Error loading employees:', error);
      throw error;
    }
  }

  async function loadSchedules() {
    try {
      const schedulesRef = collection(db, COLLECTIONS.SCHEDULES);
      // Load published schedules only, ordered by start date
      const q = query(
        schedulesRef,
        where('status', '==', 'published'),
        orderBy('startDate', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const schedulesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchedules(schedulesList);
      logger.info(`Loaded ${schedulesList.length} published schedules`);
    } catch (error) {
      logger.error('Error loading schedules:', error);
      throw error;
    }
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/supervisor')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 dark:focus:ring-offset-gray-800"
                aria-label="Back to supervisor dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <RotateCcw className="w-8 h-8 text-thr-blue-500 dark:text-thr-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Rotation Tracker
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor assignment rotation for fair distribution
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lookback Limit Control */}
        <div className="mb-6 flex items-center justify-end gap-4">
          <label htmlFor="lookback-limit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Analyze last:
          </label>
          <select
            id="lookback-limit"
            value={lookbackLimit}
            onChange={(e) => setLookbackLimit(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-thr-blue-500 focus:border-transparent"
          >
            <option value={5}>5 schedules</option>
            <option value={10}>10 schedules</option>
            <option value={15}>15 schedules</option>
            <option value={20}>20 schedules</option>
            <option value={25}>25 schedules</option>
          </select>
        </div>

        {/* Rotation View */}
        {schedules.length > 0 ? (
          <EmployeeRotationView
            employees={employees}
            schedules={schedules}
            lookbackLimit={lookbackLimit}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Published Schedules
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Rotation tracking requires at least one published schedule.
              Create and publish a schedule to start tracking rotation patterns.
            </p>
            <button
              onClick={() => navigate('/supervisor')}
              className="btn-primary dark:bg-thr-blue-600 dark:hover:bg-thr-blue-700"
            >
              Go to Supervisor Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
