import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, Minus, Users, BarChart3 } from 'lucide-react';
import AssignmentInfoPanel from './AssignmentInfoPanel';
import { calculateCpoeStats } from '../../utils/assignmentStats';

/**
 * Info panel showing CPOE assignment history and statistics
 */
export default function CpoeInfoPanel({ isOpen, onClose, employees, currentAssignments, schedules }) {
  // Calculate statistics (memoized for performance)
  const stats = useMemo(
    () => calculateCpoeStats(schedules, employees),
    [schedules, employees]
  );

  // Get current schedule CPOE assignments
  const currentCpoeEmployees = useMemo(() => {
    if (!currentAssignments) return [];
    
    return Object.entries(currentAssignments)
      .filter(([_, assignment]) => assignment.cpoe)
      .map(([employeeId]) => {
        const employee = employees.find(e => e.id === employeeId);
        return employee?.name || 'Unknown Employee';
      })
      .sort();
  }, [currentAssignments, employees]);

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getTrendText = () => {
    switch (stats.trend) {
      case 'increasing':
        return 'Increasing';
      case 'decreasing':
        return 'Decreasing';
      default:
        return 'Stable';
    }
  };

  return (
    <AssignmentInfoPanel isOpen={isOpen} onClose={onClose} title="CPOE Assignment History">
      {/* Statistics Summary */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-thr-blue-600 dark:text-thr-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Statistics Summary</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-thr-blue-600 dark:text-thr-blue-400">
              {stats.totalCount}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Assignments</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-thr-blue-600 dark:text-thr-blue-400">
              {stats.employeeBreakdown.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Unique Employees</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-thr-blue-600 dark:text-thr-blue-400">
              {currentCpoeEmployees.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Period</div>
          </div>
        </div>
      </div>

      {/* Current Schedule Assignments */}
      {currentCpoeEmployees.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-thr-green-600 dark:text-thr-green-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Current Schedule</h3>
          </div>
          <div className="bg-thr-green-50 dark:bg-thr-green-900/20 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {currentCpoeEmployees.map((name, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-thr-green-100 dark:bg-thr-green-900/40 text-thr-green-700 dark:text-thr-green-300 rounded-full text-sm font-medium"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Breakdown */}
      {stats.employeeBreakdown.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Assignment Breakdown</h3>
          </div>
          <div className="space-y-2">
            {stats.employeeBreakdown.map((emp, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {emp.employeeName}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {emp.schedules.length} schedule{emp.schedules.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-thr-blue-600 dark:text-thr-blue-400">
                    {emp.count}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">assignments</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No CPOE assignments found in historical data</p>
          <p className="text-sm mt-1">Assignments will appear here after saving schedules</p>
        </div>
      )}

      {/* Trend Indicator */}
      {stats.employeeBreakdown.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Trend: {getTrendText()}
              </span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Based on {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </AssignmentInfoPanel>
  );
}

CpoeInfoPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  employees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  currentAssignments: PropTypes.object,
  schedules: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    startDate: PropTypes.string,
    assignments: PropTypes.object
  })).isRequired
};
