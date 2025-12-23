import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';
import {
  collection,
  getDocs,
  query,
  orderBy as firestoreOrderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  TrendingUp,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  Upload,
  Calendar,
  Award,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import ProductivityImportEnhanced from '../components/ProductivityImportEnhanced';
import { DashboardSkeleton } from '../components/Skeleton';
import { ProductivityService } from '../services/productivityService';
import { format } from 'date-fns';

export default function ProductivityDashboard() {
  const { currentUser, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [entities, setEntities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'trends', 'import'
  const [periods, setPeriods] = useState([]);
  const [aggregatedStats, setAggregatedStats] = useState(null);
  const [trendData, setTrendData] = useState([]);

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

      // Load employees and entities
      const [employeesData, entitiesData] = await Promise.all([
        loadEmployees(),
        loadEntities()
      ]);

      // Load productivity data
      await loadProductivityData();
    } catch (error) {
      logger.error('Error loading productivity data:', error);
      showError('Failed to load productivity data');
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, firestoreOrderBy('name'));
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
    const q = query(entitiesRef, firestoreOrderBy('name'));
    const snapshot = await getDocs(q);
    const entitiesList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setEntities(entitiesList);
    return entitiesList;
  }

  async function loadProductivityData() {
    try {
      // Get all productivity periods
      const allPeriods = await ProductivityService.getAllPeriods(12);
      setPeriods(allPeriods);

      // Get aggregated statistics
      const stats = await ProductivityService.getAggregatedStats();
      setAggregatedStats(stats);

      // Prepare trend data
      const trends = [];
      for (const period of allPeriods.slice(0, 6).reverse()) {
        try {
          const periodData = await ProductivityService.getPeriodData(period.id);

          const totalCases = periodData.entities.reduce((sum, entity) => sum + (entity.casesReviewed || 0), 0);
          const avgQuality = periodData.entities.length > 0
            ? periodData.entities.reduce((sum, entity) => sum + (entity.qualityScore || 0), 0) / periodData.entities.length
            : 0;
          const avgReviewTime = periodData.entities.length > 0
            ? periodData.entities.reduce((sum, entity) => sum + (entity.avgReviewTime || 0), 0) / periodData.entities.length
            : 0;

          trends.push({
            period: `${format(new Date(period.startDate), 'MMM d')} - ${format(new Date(period.endDate), 'MMM d')}`,
            startDate: period.startDate,
            totalCases,
            avgQuality: parseFloat(avgQuality.toFixed(1)),
            avgReviewTime: parseFloat(avgReviewTime.toFixed(1)),
            entities: periodData.entities.length
          });
        } catch (error) {
          logger.warn(`Error loading period ${period.id}:`, error);
        }
      }

      setTrendData(trends);
    } catch (error) {
      logger.error('Error loading productivity data:', error);
      throw error;
    }
  }

  if (loading) {
    return (
      <Layout title="Productivity Tracking" subtitle="Monitor and analyze performance metrics">
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout title="Productivity Tracking" subtitle="Monitor and analyze performance metrics">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-thr-blue-500 text-thr-blue-600 dark:text-thr-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'trends'
                ? 'border-thr-blue-500 text-thr-blue-600 dark:text-thr-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-thr-blue-500 text-thr-blue-600 dark:text-thr-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Import Data
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Cases"
                value={aggregatedStats?.totalCases?.toLocaleString() || '0'}
                icon={Activity}
                color="blue"
                description={`Across ${aggregatedStats?.periodsAnalyzed || 0} periods`}
              />
              <StatCard
                title="Active Entities"
                value={aggregatedStats?.totalEntities || '0'}
                icon={BarChart3}
                color="green"
                description="Healthcare facilities"
              />
              <StatCard
                title="Top Performers"
                value={aggregatedStats?.topPerformers?.length || '0'}
                icon={Award}
                color="purple"
                description="Tracked employees"
              />
              <StatCard
                title="Data Periods"
                value={periods.length}
                icon={Calendar}
                color="orange"
                description="Historical records"
              />
            </div>

            {/* Top Entities */}
            {aggregatedStats?.topEntities && aggregatedStats.topEntities.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-thr-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Top Performing Entities
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      By total cases reviewed
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Rank
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Entity
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Total Cases
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Periods
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Avg Review Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedStats.topEntities.map((entity, index) => (
                        <tr
                          key={entity.name}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-thr-blue-100 dark:bg-thr-blue-900/20 text-thr-blue-700 dark:text-thr-blue-400 text-xs font-bold">
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {entity.name}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-700 dark:text-gray-300">
                            {entity.totalCases.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-700 dark:text-gray-300">
                            {entity.periods}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-700 dark:text-gray-300">
                            {entity.averageReviewTime ? `${entity.averageReviewTime.toFixed(1)} min` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Performers */}
            {aggregatedStats?.topPerformers && aggregatedStats.topPerformers.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-green-500/10 to-thr-green-500/5 flex items-center justify-center">
                    <Award className="w-5 h-5 text-thr-green-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Top Performing Employees
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      By total cases reviewed
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Rank
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Employee
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Total Cases
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Periods
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Avg Quality
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedStats.topPerformers.map((employee, index) => (
                        <tr
                          key={employee.name}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-thr-green-100 dark:bg-thr-green-900/20 text-thr-green-700 dark:text-thr-green-400 text-xs font-bold">
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {employee.name}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-700 dark:text-gray-300">
                            {employee.totalCases.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-700 dark:text-gray-300">
                            {employee.periods}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-700 dark:text-gray-300">
                            {employee.averageQuality ? `${employee.averageQuality.toFixed(1)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No Data State */}
            {(!aggregatedStats || aggregatedStats.periodsAnalyzed === 0) && (
              <div className="card text-center py-12">
                <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Productivity Data Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Import your first productivity report to start tracking performance metrics
                </p>
                <button
                  onClick={() => setActiveTab('import')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-thr-blue-600 hover:bg-thr-blue-700 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Import Data
                </button>
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {trendData.length > 0 ? (
              <>
                {/* Cases Trend */}
                <div className="card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
                      <LineChartIcon className="w-5 h-5 text-thr-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Cases Reviewed Trend
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Historical case volume
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="totalCases" stroke="#005C97" fill="#005C97" fillOpacity={0.3} name="Total Cases" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Quality Score Trend */}
                <div className="card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-green-500/10 to-thr-green-500/5 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-thr-green-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Quality Score Trend
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Average quality over time
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgQuality" stroke="#43B02A" strokeWidth={2} name="Avg Quality (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Review Time Trend */}
                <div className="card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Review Time Trend
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Average review time per case
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgReviewTime" fill="#8B5CF6" name="Avg Review Time (min)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="card text-center py-12">
                <LineChartIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Trend Data Available
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Import at least 2 productivity periods to view trends
                </p>
              </div>
            )}
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div>
            <ProductivityImportEnhanced employees={employees} entities={entities} />
          </div>
        )}
      </div>
    </Layout>
  );
}
