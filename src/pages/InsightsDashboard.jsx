import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';
import {
  collection,
  getDocs,
  query,
  orderBy as firestoreOrderBy,
  limit as limitQuery
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Building2,
  Lightbulb,
  Shield,
  BarChart3,
  Activity,
  Target
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { DashboardSkeleton } from '../components/Skeleton';
import { AdvancedAnalyticsService } from '../services/advancedAnalyticsService';

export default function InsightsDashboard() {
  const { currentUser, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [entities, setEntities] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [insights, setInsights] = useState({
    coverageGaps: [],
    workloadBalance: null,
    rotationPatterns: null,
    scheduleHealth: null,
    recommendations: []
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

      // Load base data
      const [employeesData, entitiesData, schedulesData] = await Promise.all([
        loadEmployees(),
        loadEntities(),
        loadSchedules()
      ]);

      // Get current schedule
      const current = schedulesData.length > 0 ? schedulesData[0] : null;
      setCurrentSchedule(current);

      // Generate insights
      generateInsights(current, employeesData, entitiesData, schedulesData);
    } catch (error) {
      logger.error('Error loading insights data:', error);
      showError('Failed to load insights');
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

  async function loadSchedules() {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, firestoreOrderBy('sortOrder', 'desc'), limitQuery(10));
    const snapshot = await getDocs(q);
    const schedulesList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSchedules(schedulesList);
    return schedulesList;
  }

  function generateInsights(schedule, employeesData, entitiesData, schedulesData) {
    const coverageGaps = AdvancedAnalyticsService.detectCoverageGaps(entitiesData, schedule);
    const workloadBalance = AdvancedAnalyticsService.analyzeWorkloadBalance(employeesData, schedule);
    const rotationPatterns = AdvancedAnalyticsService.analyzeRotationPatterns(schedulesData, employeesData);
    const scheduleHealth = AdvancedAnalyticsService.calculateScheduleHealth(schedule, employeesData, entitiesData);
    const recommendations = AdvancedAnalyticsService.generateRecommendations(
      schedule,
      employeesData,
      entitiesData,
      schedulesData
    );

    setInsights({
      coverageGaps,
      workloadBalance,
      rotationPatterns,
      scheduleHealth,
      recommendations
    });
  }

  if (loading) {
    return (
      <Layout title="Insights & Recommendations" subtitle="Smart analytics and scheduling suggestions">
        <DashboardSkeleton />
      </Layout>
    );
  }

  const healthColor = insights.scheduleHealth?.status === 'healthy'
    ? 'green'
    : insights.scheduleHealth?.status === 'fair'
    ? 'orange'
    : 'purple';

  return (
    <Layout title="Insights & Recommendations" subtitle="Smart analytics and scheduling suggestions">
      <div className="space-y-6">
        {/* Health Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Schedule Health"
            value={`${insights.scheduleHealth?.score || 0}%`}
            icon={Shield}
            color={healthColor}
            description={`Grade: ${insights.scheduleHealth?.grade || 'N/A'}`}
            trend={{
              value: insights.scheduleHealth?.status === 'healthy' ? '✓ Healthy' : '⚠ Needs Attention',
              positive: insights.scheduleHealth?.status === 'healthy'
            }}
          />
          <StatCard
            title="Coverage Gaps"
            value={insights.coverageGaps.filter(g => g.severity === 'critical').length}
            icon={AlertTriangle}
            color="orange"
            description={`${insights.coverageGaps.length} total issues`}
          />
          <StatCard
            title="Workload Balance"
            value={insights.workloadBalance?.balanced ? 'Balanced' : 'Imbalanced'}
            icon={BarChart3}
            color={insights.workloadBalance?.balanced ? 'green' : 'purple'}
            description={`σ = ${insights.workloadBalance?.standardDeviation.toFixed(1) || 0}`}
          />
          <StatCard
            title="Recommendations"
            value={insights.recommendations.length}
            icon={Lightbulb}
            color="blue"
            description={`${insights.recommendations.filter(r => r.priority === 'high').length} high priority`}
          />
        </div>

        {/* Schedule Health Breakdown */}
        {insights.scheduleHealth && (
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
                <Target className="w-5 h-5 text-thr-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Health Score Breakdown
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current schedule quality metrics
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {insights.scheduleHealth.score}
                </div>
                <div className={`text-sm font-medium ${
                  insights.scheduleHealth.status === 'healthy'
                    ? 'text-thr-green-600 dark:text-thr-green-400'
                    : insights.scheduleHealth.status === 'fair'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {insights.scheduleHealth.status.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-thr-blue-50 dark:bg-thr-blue-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Coverage</span>
                  <span className="text-lg font-bold text-thr-blue-700 dark:text-thr-blue-400">
                    {insights.scheduleHealth.breakdown.coverage}/40
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-thr-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(insights.scheduleHealth.breakdown.coverage / 40) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-thr-green-50 dark:bg-thr-green-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Balance</span>
                  <span className="text-lg font-bold text-thr-green-700 dark:text-thr-green-400">
                    {insights.scheduleHealth.breakdown.balance}/30
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-thr-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(insights.scheduleHealth.breakdown.balance / 30) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completeness</span>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-400">
                    {insights.scheduleHealth.breakdown.completeness}/30
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(insights.scheduleHealth.breakdown.completeness / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {insights.scheduleHealth.issues.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Issues Detected
                </h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  {insights.scheduleHealth.issues.map((issue, idx) => (
                    <li key={idx}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-green-500/10 to-thr-green-500/5 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-thr-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Smart Recommendations
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automated suggestions to improve schedule quality
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {insights.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    rec.priority === 'high'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      : rec.priority === 'medium'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      rec.priority === 'high'
                        ? 'bg-red-100 dark:bg-red-900/40'
                        : rec.priority === 'medium'
                        ? 'bg-orange-100 dark:bg-orange-900/40'
                        : 'bg-blue-100 dark:bg-blue-900/40'
                    }`}>
                      {rec.priority === 'high' ? (
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : rec.priority === 'medium' ? (
                        <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {rec.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rec.priority === 'high'
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                            : rec.priority === 'medium'
                            ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        }`}>
                          {rec.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {rec.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coverage Gaps */}
          {insights.coverageGaps.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Coverage Gaps
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Entities needing attention
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {insights.coverageGaps.slice(0, 10).map((gap, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      gap.severity === 'critical'
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {gap.entity}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        gap.severity === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {gap.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {gap.assignedCount}/{gap.recommendedCount} reviewers assigned
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workload Distribution */}
          {insights.workloadBalance && insights.workloadBalance.employeeWorkloads.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Workload Distribution
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Employee assignment balance
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={insights.workloadBalance.employeeWorkloads.slice(0, 15).sort((a, b) => b.score - a.score)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" name="Workload Score">
                    {insights.workloadBalance.employeeWorkloads.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.percentOfAverage > 130 ? '#EF4444' :
                          entry.percentOfAverage < 70 ? '#3B82F6' :
                          '#43B02A'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span className="text-gray-600 dark:text-gray-400">Overloaded (&gt;130%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-thr-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">Balanced</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">Underutilized (&lt;70%)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rotation Patterns */}
        {insights.rotationPatterns && insights.rotationPatterns.employeeRotations.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-500/5 flex items-center justify-center">
                <Activity className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Rotation & Diversity Analysis
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Employee exposure to different entities and roles
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Employee
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Participation
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Entity Variety
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      DAR Rotations
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Diversity Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {insights.rotationPatterns.employeeRotations.slice(0, 15).map((rotation, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {rotation.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          rotation.scheduleParticipation >= 80
                            ? 'bg-thr-green-100 dark:bg-thr-green-900/20 text-thr-green-700 dark:text-thr-green-400'
                            : rotation.scheduleParticipation >= 50
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}>
                          {rotation.scheduleParticipation}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700 dark:text-gray-300">
                        {rotation.entityVariety} entities
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700 dark:text-gray-300">
                        {rotation.darRotationCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-thr-blue-100 dark:bg-thr-blue-900/20 text-thr-blue-700 dark:text-thr-blue-400">
                          {rotation.diversityScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
