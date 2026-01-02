import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';
import { AuditService } from '../services/auditService';
import { detectConflicts } from '../utils/conflictDetection';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Calendar,
  LogOut,
  Users,
  Settings as SettingsIcon,
  FileText,
  Plus,
  Eye,
  Upload,
  CheckCircle2,
  LayoutDashboard,
  Building2,
  Activity,
  TrendingUp,
  AlertCircle,
  Clock,
  RotateCcw
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
  const [activeTab, setActiveTab] = useState('overview');
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

      // Use Promise.allSettled to allow partial data loading if one fails
      const results = await Promise.allSettled([
        loadEmployees(),
        loadEntities(),
        loadSchedules(darConfigData.config)
      ]);

      // Log any failures but continue with successfully loaded data
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const dataTypes = ['employees', 'entities', 'schedules'];
          logger.error(`Failed to load ${dataTypes[index]}:`, result.reason);
          showError(`Failed to load ${dataTypes[index]}. Some data may be unavailable.`);
        }
      });
    } catch (error) {
      logger.error('Error loading data:', error);
      showError('Failed to load configuration data');
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
      logger.error('Error loading DAR defaults:', error);
      return { config: {}, darCount: 5 };
    }
  }

  async function loadSchedules(darConfig = defaultDarConfig) {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, orderBy('createdAt', 'desc'), limit(50)); // Limit to 50 most recent schedules
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
        version: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'schedules'), newSchedule);
      const created = { id: docRef.id, ...newSchedule };
      setCurrentSchedule(created);
      setSchedules((prev) => [created, ...prev]);

      // Log audit trail
      await AuditService.log({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        action: 'schedule.create',
        resourceType: 'schedule',
        resourceId: docRef.id,
        metadata: {
          scheduleName: newSchedule.name,
          darCount: newSchedule.darCount
        }
      });
    } catch (error) {
      logger.error('Error creating schedule:', error);
      showError('Failed to create new schedule');
    } finally {
      setCreatingSchedule(false);
    }
  }

  async function saveSchedule(scheduleData) {
    if (!currentSchedule) return;

    try {
      const scheduleRef = doc(db, 'schedules', currentSchedule.id);

      // P0-1: Use Firestore transaction for optimistic locking
      await runTransaction(db, async (transaction) => {
        // Read current document
        const scheduleDoc = await transaction.get(scheduleRef);

        if (!scheduleDoc.exists()) {
          throw new Error('Schedule no longer exists');
        }

        const currentData = scheduleDoc.data();
        const currentVersion = currentData.version || 0;
        const expectedVersion = currentSchedule.version || 0;

        // Check if versions match (no concurrent edits)
        if (currentVersion !== expectedVersion) {
          // Version mismatch - someone else edited this schedule
          throw {
            code: 'version-conflict',
            currentVersion,
            expectedVersion,
            message: 'Another supervisor has edited this schedule since you last loaded it.'
          };
        }

        // Versions match - safe to update
        const changes = AuditService.detectChanges(currentData, scheduleData);

        transaction.update(scheduleRef, {
          ...scheduleData,
          version: currentVersion + 1,  // Increment version
          updatedAt: serverTimestamp()
        });

        // Log audit trail (outside transaction to avoid hanging)
        setTimeout(() => {
          AuditService.log({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            action: 'schedule.update',
            resourceType: 'schedule',
            resourceId: currentSchedule.id,
            changes: changes,
            metadata: {
              scheduleName: scheduleData.name || currentSchedule.name,
              version: currentVersion + 1
            }
          });
        }, 0);
      });

      // Update local state with new version
      const newVersion = (currentSchedule.version || 0) + 1;
      setCurrentSchedule({ ...currentSchedule, ...scheduleData, version: newVersion });
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === currentSchedule.id
            ? { ...schedule, ...scheduleData, version: newVersion }
            : schedule
        )
      );

      showSuccess('Schedule saved successfully!');
    } catch (error) {
      logger.error('Error saving schedule:', error);

      // P0-1: Handle version conflict specifically
      if (error.code === 'version-conflict') {
        const reload = await showConfirm(
          `${error.message}\n\nYour changes: Version ${error.expectedVersion}\nCurrent version: ${error.currentVersion}\n\nWould you like to reload the latest version? (Your unsaved changes will be lost)`,
          { confirmText: 'Reload Latest', cancelText: 'Keep My Changes' }
        );

        if (reload) {
          // Reload the schedule from Firestore
          const scheduleRef = doc(db, 'schedules', currentSchedule.id);
          const freshDoc = await getDoc(scheduleRef);
          if (freshDoc.exists()) {
            const freshData = { id: freshDoc.id, ...freshDoc.data() };
            setCurrentSchedule(freshData);
            setSchedules((prev) =>
              prev.map((s) => (s.id === currentSchedule.id ? freshData : s))
            );
            showSuccess('Schedule reloaded with latest changes');
          }
        } else {
          showError('Your changes were not saved. Try saving again after resolving conflicts.');
        }
      } else {
        showError('Failed to save schedule');
      }
    }
  }

  async function publishSchedule() {
    if (!currentSchedule) return;

    // P0-2: Validate schedule before publishing - block if errors exist
    const conflictResults = detectConflicts(
      currentSchedule.assignments || {},
      employees,
      currentSchedule.darEntities || {}
    );

    if (conflictResults.conflicts.length > 0) {
      // Block publishing with errors
      const errorList = conflictResults.conflicts
        .map((c, idx) => `${idx + 1}. ${c.message}`)
        .join('\n');

      await showConfirm(
        `Cannot publish schedule with ${conflictResults.conflicts.length} error${conflictResults.conflicts.length !== 1 ? 's' : ''}:\n\n${errorList}\n\nPlease fix these errors before publishing.`,
        { confirmText: 'OK', cancelText: null }
      );
      return; // Block publishing
    }

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

      // Log audit trail
      await AuditService.log({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        action: 'schedule.publish',
        resourceType: 'schedule',
        resourceId: currentSchedule.id,
        metadata: {
          scheduleName: currentSchedule.name
        }
      });

      showSuccess('Schedule published successfully!');
    } catch (error) {
      logger.error('Error publishing schedule:', error);
      showError('Failed to publish schedule');
    }
  }

  async function deleteSchedule(scheduleId) {
    const scheduleToDelete = schedules.find(s => s.id === scheduleId);
    if (!scheduleToDelete) return;

    const confirmed = await showConfirm(
      `Are you sure you want to delete "${scheduleToDelete.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const scheduleRef = doc(db, 'schedules', scheduleId);
      await deleteDoc(scheduleRef);

      setSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId));
      
      // If we're deleting the currently open schedule, clear it
      if (currentSchedule?.id === scheduleId) {
        setCurrentSchedule(null);
      }

      // Log audit trail
      await AuditService.log({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        action: 'schedule.delete',
        resourceType: 'schedule',
        resourceId: scheduleId,
        metadata: {
          scheduleName: scheduleToDelete.name
        }
      });

      showSuccess('Schedule deleted successfully!');
    } catch (error) {
      logger.error('Error deleting schedule:', error);
      showError('Failed to delete schedule');
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      logger.error('Logout error:', error);
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
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-thr-blue-500 ${
                activeTab === 'overview'
                  ? 'border-thr-blue-500 text-thr-blue-600 dark:text-thr-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-controls="overview-panel"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                Overview
              </div>
            </button>
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
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab">
            <div className="space-y-6">
              {/* Core Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Active Employees"
                  value={employees.filter(emp => !emp.archived).length}
                  icon={Users}
                  color="blue"
                  description="Non-archived reviewers"
                />
                <StatCard
                  title="Total Entities"
                  value={entities.length}
                  icon={Building2}
                  color="green"
                  description="Healthcare facilities"
                />
                <StatCard
                  title="Current Schedule"
                  value={currentSchedule ? currentSchedule.status.charAt(0).toUpperCase() + currentSchedule.status.slice(1) : 'None'}
                  icon={Calendar}
                  color={currentSchedule?.status === 'published' ? 'green' : 'orange'}
                  description={currentSchedule ? currentSchedule.name : 'No active schedule'}
                />
                <StatCard
                  title="Total Assignments"
                  value={currentSchedule ? Object.keys(currentSchedule.assignments || {}).length : 0}
                  icon={Activity}
                  color="purple"
                  description="In current schedule"
                />
              </div>

              {/* Schedule Health Row */}
              {currentSchedule && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Conflicts"
                    value={(() => {
                      const conflicts = detectConflicts(
                        currentSchedule.assignments || {},
                        employees,
                        currentSchedule.darEntities || {}
                      );
                      return conflicts.conflicts.length;
                    })()}
                    icon={AlertCircle}
                    color={(() => {
                      const conflicts = detectConflicts(
                        currentSchedule.assignments || {},
                        employees,
                        currentSchedule.darEntities || {}
                      );
                      return conflicts.conflicts.length > 0 ? 'orange' : 'green';
                    })()}
                    description={(() => {
                      const conflicts = detectConflicts(
                        currentSchedule.assignments || {},
                        employees,
                        currentSchedule.darEntities || {}
                      );
                      return conflicts.conflicts.length > 0 ? 'Needs attention' : 'No issues detected';
                    })()}
                  />
                  <StatCard
                    title="Coverage Rate"
                    value={(() => {
                      const assignments = currentSchedule.assignments || {};
                      const assignedEntities = new Set();
                      Object.values(assignments).forEach(assignment => {
                        if (assignment.dars) assignment.dars.forEach(e => assignedEntities.add(e));
                        if (assignment.newIncoming) assignment.newIncoming.forEach(e => assignedEntities.add(e));
                        if (assignment.crossTraining) assignment.crossTraining.forEach(e => assignedEntities.add(e));
                      });
                      return entities.length > 0 ? `${Math.round((assignedEntities.size / entities.length) * 100)}%` : '0%';
                    })()}
                    icon={TrendingUp}
                    color="purple"
                    description="Entities with assignments"
                  />
                  <StatCard
                    title="Avg Workload"
                    value={(() => {
                      const assignments = currentSchedule.assignments || {};
                      const employeesWithWork = Object.keys(assignments).length;
                      if (employeesWithWork === 0) return '0';
                      let totalWork = 0;
                      Object.values(assignments).forEach(assignment => {
                        if (assignment.dars) totalWork += assignment.dars.length;
                        if (assignment.newIncoming) totalWork += assignment.newIncoming.length;
                        if (assignment.crossTraining) totalWork += assignment.crossTraining.length;
                        if (assignment.cpoe) totalWork += 1;
                      });
                      return (totalWork / employeesWithWork).toFixed(1);
                    })()}
                    icon={Activity}
                    color="teal"
                    description="Assignments per employee"
                  />
                </div>
              )}

              {/* Quick Actions */}
              <div className="card dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={createNewSchedule}
                    className="btn-primary dark:bg-thr-blue-600 dark:hover:bg-thr-blue-700"
                  >
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Create New Schedule
                  </button>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="btn-secondary dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Manage Schedules
                  </button>
                  <button
                    onClick={() => navigate('/rotation')}
                    className="btn-secondary dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-2" />
                    Rotation Tracker
                  </button>
                  <button
                    onClick={() => navigate('/analytics')}
                    className="btn-secondary dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    View Analytics
                  </button>
                  {currentSchedule && (
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className="btn-secondary dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      Export Schedule
                    </button>
                  )}
                </div>
              </div>

              {/* Recent Schedules */}
              <div className="card dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Recent Schedules
                  </h3>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="text-sm text-thr-blue-600 dark:text-thr-blue-400 hover:text-thr-blue-700 dark:hover:text-thr-blue-300"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-3">
                  {schedules.slice(0, 5).map(schedule => (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        currentSchedule?.id === schedule.id
                          ? 'border-thr-blue-500 bg-thr-blue-50 dark:bg-thr-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {schedule.name}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                schedule.status === 'published'
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                              }`}
                            >
                              {schedule.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {schedule.startDate || 'Not set'} - {schedule.endDate || 'Not set'}
                            </span>
                            <span>
                              {Object.keys(schedule.assignments || {}).length} employees assigned
                            </span>
                          </div>
                        </div>
                        {currentSchedule?.id !== schedule.id && (
                          <button
                            onClick={() => {
                              setCurrentSchedule(schedule);
                              setActiveTab('schedule');
                            }}
                            className="ml-4 px-3 py-1.5 text-sm font-medium text-thr-blue-600 dark:text-thr-blue-400 hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 rounded-lg transition-colors"
                          >
                            Load
                          </button>
                        )}
                        {currentSchedule?.id === schedule.id && (
                          <span className="ml-4 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {schedules.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No schedules yet. Create your first schedule to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div id="schedule-panel" role="tabpanel" aria-labelledby="schedule-tab">
            {/* Schedule Actions */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
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
                
                {/* Schedule Selector */}
                {schedules.length > 0 && (
                  <div className="mt-3">
                    <label htmlFor="schedule-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Load Schedule
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        id="schedule-select"
                        value={currentSchedule?.id || ''}
                        onChange={(e) => {
                          const selected = schedules.find(s => s.id === e.target.value);
                          setCurrentSchedule(selected || null);
                        }}
                        className="block w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-thr-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a schedule...</option>
                        {schedules.map(schedule => (
                          <option key={schedule.id} value={schedule.id}>
                            {schedule.name} ({schedule.status})
                          </option>
                        ))}
                      </select>
                      {currentSchedule && (
                        <button
                          onClick={() => deleteSchedule(currentSchedule.id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          aria-label="Delete current schedule"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
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
                onScheduleChange={setCurrentSchedule}
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
