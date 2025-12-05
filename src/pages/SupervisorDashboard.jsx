import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Calendar,
  LogOut,
  Users,
  Settings as SettingsIcon,
  FileText,
  Plus,
  Save,
  Eye,
  Upload,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';
import ScheduleGrid from '../components/ScheduleGrid';
import EmployeeManagement from '../components/EmployeeManagement';
import Settings from '../components/Settings';
import { DashboardSkeleton } from '../components/Skeleton';
import ThemeToggle from '../components/ThemeToggle';
import StatCard from '../components/StatCard';

export default function SupervisorDashboard() {
  const { currentUser, logout, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useToast();
  const [activeTab, setActiveTab] = useState('schedule');
  const [employees, setEmployees] = useState([]);
  const [entities, setEntities] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [defaultDarConfig, setDefaultDarConfig] = useState({});
  const [defaultDarCount, setDefaultDarCount] = useState(5); // Default to 5 DARs
  const [loading, setLoading] = useState(true);
  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const scheduleStatus = currentSchedule?.status || 'draft';

  useEffect(() => {
    if (!isSupervisor) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isSupervisor, navigate]);

  async function loadData() {
    try {
      const darConfigData = await loadDarConfig();
      await Promise.all([
        loadEmployees(),
        loadEntities(),
        loadSchedules(darConfigData.config)
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, orderBy('name'));
    const snapshot = await getDocs(q);
    const employeesList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setEmployees(employeesList);
  }

  async function loadEntities() {
    const entitiesRef = collection(db, 'entities');
    const q = query(entitiesRef, orderBy('name'));
    const snapshot = await getDocs(q);
    const entitiesList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setEntities(entitiesList);
  }

  async function loadDarConfig() {
    try {
      const configDoc = await getDoc(doc(db, 'settings', 'darConfig'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        const config = data.config || {};
        const darCount = data.darCount || 5;
        setDefaultDarConfig(config);
        setDefaultDarCount(darCount);
        return { config, darCount };
      }
      return { config: {}, darCount: 5 };
    } catch (error) {
      console.error('Error loading DAR defaults:', error);
      return { config: {}, darCount: 5 };
    }
  }

  async function loadSchedules(darConfig = defaultDarConfig) {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const schedulesList = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status || 'draft',
        darEntities: data.darEntities || darConfig,
        ...data
      };
    });
    setSchedules(schedulesList);

    // Prefer the most recent draft, otherwise show the latest schedule
    const draftSchedule = schedulesList.find(s => s.status === 'draft');
    const latestSchedule = schedulesList[0] || null;
    setCurrentSchedule(draftSchedule || latestSchedule);
  }

  async function createNewSchedule() {
    if (creatingSchedule) return;

    if (currentSchedule?.status === 'draft') {
      const confirmed = await showConfirm(
        'You already have a draft schedule. Start a new one anyway?',
        { confirmText: 'Start new', cancelText: 'Keep editing' }
      );
      if (!confirmed) return;
    }

    setCreatingSchedule(true);

    try {
      let darConfig = defaultDarConfig;
      let darCount = defaultDarCount;
      
      if (!Object.keys(defaultDarConfig || {}).length) {
        const configData = await loadDarConfig();
        darConfig = configData.config;
        darCount = configData.darCount;
      }

      const newSchedule = {
        name: `Schedule ${new Date().toLocaleDateString()}`,
        startDate: '',
        endDate: '',
        status: 'draft',
        assignments: {},
        darEntities: darConfig,
        darCount: darCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'schedules'), newSchedule);
      const created = { id: docRef.id, ...newSchedule };
      setCurrentSchedule(created);
      setSchedules((prev) => [created, ...prev]);
    } catch (error) {
      console.error('Error creating schedule:', error);
      showError('Failed to create new schedule');
    } finally {
      setCreatingSchedule(false);
    }
  }

  async function saveSchedule(scheduleData) {
    if (!currentSchedule) return;

    try {
      const scheduleRef = doc(db, 'schedules', currentSchedule.id);
      await updateDoc(scheduleRef, {
        ...scheduleData,
        updatedAt: serverTimestamp()
      });

      setCurrentSchedule({ ...currentSchedule, ...scheduleData });
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === currentSchedule.id
            ? { ...schedule, ...scheduleData }
            : schedule
        )
      );
      showSuccess('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      showError('Failed to save schedule');
    }
  }

  async function publishSchedule() {
    if (!currentSchedule) return;

    const confirmed = await showConfirm(
      'Are you sure you want to publish this schedule? Users will be able to view it.'
    );

    if (!confirmed) return;

    try {
      const scheduleRef = doc(db, 'schedules', currentSchedule.id);
      await updateDoc(scheduleRef, {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setCurrentSchedule({ ...currentSchedule, status: 'published' });
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === currentSchedule.id
            ? { ...schedule, status: 'published' }
            : schedule
        )
      );
      showSuccess('Schedule published successfully!');
    } catch (error) {
      console.error('Error publishing schedule:', error);
      showError('Failed to publish schedule');
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
              <Calendar className="w-8 h-8 text-thr-blue-500 dark:text-thr-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Supervisor Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Clinical Review Scheduling
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => navigate('/schedule')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-200 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 dark:focus:ring-offset-gray-800"
                aria-label="View public schedule"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm font-medium">View Public Schedule</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8" role="tablist">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-thr-blue-500 ${
                activeTab === 'schedule'
                  ? 'border-thr-blue-500 text-thr-blue-600 dark:text-thr-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              role="tab"
              aria-selected={activeTab === 'schedule'}
              aria-controls="schedule-panel"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" aria-hidden="true" />
                Schedule Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-thr-blue-500 ${
                activeTab === 'employees'
                  ? 'border-thr-blue-500 text-thr-blue-600 dark:text-thr-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              role="tab"
              aria-selected={activeTab === 'employees'}
              aria-controls="employees-panel"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" aria-hidden="true" />
                Employee Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-thr-blue-500 ${
                activeTab === 'settings'
                  ? 'border-thr-blue-500 text-thr-blue-600 dark:text-thr-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              role="tab"
              aria-selected={activeTab === 'settings'}
              aria-controls="settings-panel"
            >
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" aria-hidden="true" />
                Settings
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'schedule' && (
          <div id="schedule-panel" role="tabpanel" aria-labelledby="schedule-tab">
            {/* Schedule Actions */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                {currentSchedule ? (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {currentSchedule.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Status:{' '}
                      <span
                        className={`font-medium ${
                          scheduleStatus === 'published'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}
                      >
                        {scheduleStatus.toUpperCase()}
                      </span>
                    </p>
                  </div>
                ) : (
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    No Active Schedule
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={createNewSchedule}
                  disabled={creatingSchedule}
                  className={`btn-primary dark:bg-thr-blue-600 dark:hover:bg-thr-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 dark:focus:ring-offset-gray-900 ${creatingSchedule ? 'opacity-70 cursor-not-allowed' : ''}`}
                  aria-label="Create new schedule"
                >
                  <Plus className="w-4 h-4 inline mr-2" aria-hidden="true" />
                  {creatingSchedule ? 'Creating...' : currentSchedule ? 'Start New Schedule' : 'Create New Schedule'}
                </button>
                {currentSchedule && scheduleStatus !== 'published' && (
                  <>
                    <button
                      onClick={publishSchedule}
                      className="btn-secondary dark:bg-thr-green-700 dark:hover:bg-thr-green-800 dark:text-white focus:ring-2 focus:ring-offset-2 focus:ring-thr-green-500 dark:focus:ring-offset-gray-900"
                      aria-label="Publish schedule"
                    >
                      <Upload className="w-4 h-4 inline mr-2" aria-hidden="true" />
                      Publish Schedule
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Schedule Grid */}
            {currentSchedule ? (
              <ScheduleGrid
                schedule={currentSchedule}
                employees={employees}
                entities={entities}
                onSave={saveSchedule}
                onCreateNewSchedule={createNewSchedule}
                readOnly={false}
                schedules={schedules}
              />
            ) : (
              <div className="card dark:bg-gray-800 dark:border-gray-700 text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Active Schedule
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create a new schedule to start assigning employees
                </p>
                <button onClick={createNewSchedule} className="btn-primary dark:bg-thr-blue-600 dark:hover:bg-thr-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 dark:focus:ring-offset-gray-800" aria-label="Create new schedule">
                  <Plus className="w-4 h-4 inline mr-2" aria-hidden="true" />
                  Create New Schedule
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'employees' && (
          <EmployeeManagement
            employees={employees}
            onUpdate={loadEmployees}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            employees={employees}
            onUpdate={loadData}
          />
        )}
      </main>
    </div>
  );
}
