import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Calendar,
  LogOut,
  Users,
  Building2,
  FileText,
  Plus,
  Save,
  Eye,
  Upload
} from 'lucide-react';
import ScheduleGrid from '../components/ScheduleGrid';
import EmployeeManagement from '../components/EmployeeManagement';
import EntityManagement from '../components/EntityManagement';

export default function SupervisorDashboard() {
  const { currentUser, logout, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('schedule');
  const [employees, setEmployees] = useState([]);
  const [entities, setEntities] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupervisor) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isSupervisor, navigate]);

  async function loadData() {
    try {
      await Promise.all([
        loadEmployees(),
        loadEntities(),
        loadSchedules()
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

  async function loadSchedules() {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const schedulesList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSchedules(schedulesList);

    // Load the most recent draft or create a new one
    const draftSchedule = schedulesList.find(s => s.status === 'draft');
    if (draftSchedule) {
      setCurrentSchedule(draftSchedule);
    }
  }

  async function createNewSchedule() {
    try {
      const newSchedule = {
        name: `Schedule ${new Date().toLocaleDateString()}`,
        startDate: '',
        endDate: '',
        status: 'draft',
        assignments: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'schedules'), newSchedule);
      const created = { id: docRef.id, ...newSchedule };
      setCurrentSchedule(created);
      setSchedules([created, ...schedules]);
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create new schedule');
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
      alert('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    }
  }

  async function publishSchedule() {
    if (!currentSchedule) return;

    const confirmed = window.confirm(
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
      alert('Schedule published successfully!');
    } catch (error) {
      console.error('Error publishing schedule:', error);
      alert('Failed to publish schedule');
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-thr-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
                  Supervisor Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Clinical Review Scheduling
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/schedule')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">View Public Schedule</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'schedule'
                  ? 'border-thr-blue-500 text-thr-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Schedule Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'employees'
                  ? 'border-thr-blue-500 text-thr-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Employee Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('entities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'entities'
                  ? 'border-thr-blue-500 text-thr-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Entity Management
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'schedule' && (
          <div>
            {/* Schedule Actions */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                {currentSchedule ? (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {currentSchedule.name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Status:{' '}
                      <span
                        className={`font-medium ${
                          currentSchedule.status === 'published'
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {currentSchedule.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                ) : (
                  <h2 className="text-xl font-semibold text-gray-900">
                    No Active Schedule
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!currentSchedule && (
                  <button onClick={createNewSchedule} className="btn-primary">
                    <Plus className="w-4 h-4 inline mr-2" />
                    Create New Schedule
                  </button>
                )}
                {currentSchedule && currentSchedule.status === 'draft' && (
                  <>
                    <button
                      onClick={publishSchedule}
                      className="btn-secondary"
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
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
                readOnly={false}
              />
            ) : (
              <div className="card text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Active Schedule
                </h3>
                <p className="text-gray-600 mb-6">
                  Create a new schedule to start assigning employees
                </p>
                <button onClick={createNewSchedule} className="btn-primary">
                  <Plus className="w-4 h-4 inline mr-2" />
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

        {activeTab === 'entities' && (
          <EntityManagement
            entities={entities}
            onUpdate={loadEntities}
          />
        )}
      </main>
    </div>
  );
}
