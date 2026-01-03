import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as limitQuery
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Users,
  Building2,
  Calendar,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { DashboardSkeleton } from '../components/Skeleton';
import { format } from 'date-fns';

const COLORS = ['#005C97', '#43B02A', '#FF6B35', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'];

export default function AnalyticsDashboard() {
  const { currentUser, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [entities, setEntities] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    entityDistribution: [],
    employeeWorkload: [],
    totalEmployees: 0,
    totalEntities: 0,
    coveragePercentage: 0,
    activeSchedules: 0
  });

  useEffect(() => {
    if (!isSupervisor) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isSupervisor, navigate]);

  async function loadData() {
    try {
      setLoading(true);

      // Load employees, entities, and schedules
      const [employeesData, entitiesData, schedulesData] = await Promise.all([
        loadEmployees(),
        loadEntities(),
        loadSchedules()
      ]);

      // Calculate analytics
      calculateAnalytics(employeesData, entitiesData, schedulesData);
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
      showError('Failed to load analytics data');
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
    })).filter(emp => !emp.archived);
    setEmployees(employeesList);
    return employeesList;
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
    return entitiesList;
  }

  async function loadSchedules() {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, orderBy('sortOrder', 'desc'), limitQuery(10));
    const snapshot = await getDocs(q);
    const schedulesList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSchedules(schedulesList);
    return schedulesList;
  }

  function calculateAnalytics(employeesData, entitiesData, schedulesData) {
    // Calculate entity distribution from schedules
    const entityCounts = {};
    let totalAssignments = 0;

    schedulesData.forEach(schedule => {
      if (schedule.assignments) {
        Object.values(schedule.assignments).forEach(assignment => {
          // Count DAR assignments
          if (assignment.dars && Array.isArray(assignment.dars)) {
            totalAssignments += assignment.dars.length;
          }

          // Count New Incoming assignments
          if (assignment.newIncoming && Array.isArray(assignment.newIncoming)) {
            assignment.newIncoming.forEach(entity => {
              entityCounts[entity] = (entityCounts[entity] || 0) + 1;
              totalAssignments++;
            });
          }

          // Count Cross Training assignments
          if (assignment.crossTraining && Array.isArray(assignment.crossTraining)) {
            assignment.crossTraining.forEach(entity => {
              entityCounts[entity] = (entityCounts[entity] || 0) + 1;
              totalAssignments++;
            });
          }
        });
      }
    });

    // Prepare entity distribution data for pie chart
    const entityDistribution = Object.entries(entityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 entities

    // Calculate employee workload from most recent schedule
    const employeeWorkload = [];
    if (schedulesData.length > 0) {
      const recentSchedule = schedulesData[0];
      if (recentSchedule.assignments) {
        employeesData.forEach(employee => {
          const assignment = recentSchedule.assignments[employee.id];
          if (assignment) {
            let workloadCount = 0;

            if (assignment.dars) workloadCount += assignment.dars.length;
            if (assignment.newIncoming) workloadCount += assignment.newIncoming.length;
            if (assignment.crossTraining) workloadCount += assignment.crossTraining.length;
            if (assignment.cpoe) workloadCount += 1;
            if (assignment.specialProjects) {
              if (assignment.specialProjects.float) workloadCount += 1;
              if (assignment.specialProjects.threePEmail) workloadCount += 1;
            }

            employeeWorkload.push({
              name: employee.name.split(' ').map(n => n[0]).join(''), // Initials for chart
              fullName: employee.name,
              assignments: workloadCount
            });
          }
        });
      }
    }

    // Sort by workload descending
    employeeWorkload.sort((a, b) => b.assignments - a.assignments);

    // Calculate coverage percentage
    const entitiesCovered = Object.keys(entityCounts).length;
    const coveragePercentage = entitiesData.length > 0
      ? Math.round((entitiesCovered / entitiesData.length) * 100)
      : 0;

    setAnalyticsData({
      entityDistribution,
      employeeWorkload: employeeWorkload.slice(0, 15), // Top 15 employees
      totalEmployees: employeesData.length,
      totalEntities: entitiesData.length,
      coveragePercentage,
      activeSchedules: schedulesData.length
    });
  }

  if (loading) {
    return (
      <Layout title="Analytics Dashboard" subtitle="Schedule insights and metrics">
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout title="Analytics Dashboard" subtitle="Schedule insights and metrics">
      <div className="space-y-6">
        {/* Key Metrics Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Employees"
            value={analyticsData.totalEmployees}
            icon={Users}
            color="blue"
            description="Active reviewers"
          />
          <StatCard
            title="Entities Covered"
            value={analyticsData.totalEntities}
            icon={Building2}
            color="green"
            description="Healthcare facilities"
          />
          <StatCard
            title="Coverage Rate"
            value={`${analyticsData.coveragePercentage}%`}
            icon={Activity}
            color="purple"
            description="Entity coverage"
          />
          <StatCard
            title="Active Schedules"
            value={analyticsData.activeSchedules}
            icon={Calendar}
            color="orange"
            description="Recent periods"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Entity Distribution Pie Chart */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
                <PieChartIcon className="w-5 h-5 text-thr-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Entity Assignment Distribution
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Top 10 entities by assignment frequency
                </p>
              </div>
            </div>
            {analyticsData.entityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.entityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.substring(0, 20)} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.entityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                No assignment data available
              </div>
            )}
          </div>

          {/* Employee Workload Bar Chart */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-green-500/10 to-thr-green-500/5 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-thr-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Employee Workload Comparison
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current schedule assignment counts
                </p>
              </div>
            </div>
            {analyticsData.employeeWorkload.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.employeeWorkload}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {payload[0].payload.fullName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Assignments: {payload[0].value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="assignments" fill="#43B02A" name="Assignments" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                No workload data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Schedules Table */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Schedules
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Quick access to schedule periods
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Period
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Date Range
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Assignments
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    DARs
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedules.length > 0 ? (
                  schedules.map((schedule, index) => {
                    const assignmentCount = schedule.assignments
                      ? Object.keys(schedule.assignments).length
                      : 0;

                    return (
                      <tr
                        key={schedule.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Schedule {schedules.length - index}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {schedule.startDate && format(new Date(schedule.startDate), 'MMM d, yyyy')} - {schedule.endDate && format(new Date(schedule.endDate), 'MMM d, yyyy')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-thr-green-100 dark:bg-thr-green-900/20 text-thr-green-700 dark:text-thr-green-400">
                            {assignmentCount} employees
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-thr-blue-100 dark:bg-thr-blue-900/20 text-thr-blue-700 dark:text-thr-blue-400">
                            {schedule.darCount || 0} columns
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => navigate('/supervisor')}
                            className="text-sm font-medium text-thr-blue-600 hover:text-thr-blue-700 dark:text-thr-blue-400 dark:hover:text-thr-blue-300 transition-colors"
                          >
                            View Schedule →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No schedules found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-500/5 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Assignments per Employee
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {analyticsData.employeeWorkload.length > 0
                    ? (
                        analyticsData.employeeWorkload.reduce((sum, emp) => sum + emp.assignments, 0) /
                        analyticsData.employeeWorkload.length
                      ).toFixed(1)
                    : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Most Assigned Entity
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {analyticsData.entityDistribution.length > 0
                    ? analyticsData.entityDistribution[0].name.substring(0, 20)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Busiest Reviewer
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {analyticsData.employeeWorkload.length > 0
                    ? analyticsData.employeeWorkload[0].fullName.split(' ')[0]
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
