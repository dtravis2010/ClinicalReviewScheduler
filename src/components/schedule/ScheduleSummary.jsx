import PropTypes from 'prop-types';
import { Users, Building2, CheckCircle, AlertCircle, Activity } from 'lucide-react';

/**
 * ScheduleSummary component
 * Shows quick stats and metrics about the current schedule
 */
export default function ScheduleSummary({
  totalEmployees,
  assignedEmployees,
  totalEntities,
  assignedEntities,
  totalAssignments,
  conflicts = 0
}) {
  const employeeCoverage = totalEmployees > 0 ? (assignedEmployees / totalEmployees * 100).toFixed(0) : 0;
  const entityCoverage = totalEntities > 0 ? (assignedEntities / totalEntities * 100).toFixed(0) : 0;

  const stats = [
    {
      icon: Users,
      label: 'Employees',
      value: `${assignedEmployees}/${totalEmployees}`,
      percentage: employeeCoverage,
      color: 'blue'
    },
    {
      icon: Building2,
      label: 'Entities',
      value: `${assignedEntities}/${totalEntities}`,
      percentage: entityCoverage,
      color: 'green'
    },
    {
      icon: Activity,
      label: 'Assignments',
      value: totalAssignments,
      color: 'purple'
    },
    {
      icon: conflicts > 0 ? AlertCircle : CheckCircle,
      label: 'Status',
      value: conflicts > 0 ? `${conflicts} ${conflicts === 1 ? 'Issue' : 'Issues'}` : 'Clear',
      color: conflicts > 0 ? 'orange' : 'green'
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-thr-blue-50 dark:bg-thr-blue-900/20',
      icon: 'text-thr-blue-600 dark:text-thr-blue-400',
      progress: 'bg-thr-blue-500 dark:bg-thr-blue-400'
    },
    green: {
      bg: 'bg-thr-green-50 dark:bg-thr-green-900/20',
      icon: 'text-thr-green-600 dark:text-thr-green-400',
      progress: 'bg-thr-green-500 dark:bg-thr-green-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      progress: 'bg-purple-500 dark:bg-purple-400'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'text-orange-600 dark:text-orange-400',
      progress: 'bg-orange-500 dark:bg-orange-400'
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 px-4 pt-4 pb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = colorClasses[stat.color];

          return (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </p>
                  {stat.percentage !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Coverage</span>
                        <span className={`font-semibold ${colors.icon}`}>{stat.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div
                          className={`${colors.progress} h-1.5 rounded-full transition-all duration-500`}
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className={`ml-3 p-3 rounded-xl ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

ScheduleSummary.propTypes = {
  totalEmployees: PropTypes.number.isRequired,
  assignedEmployees: PropTypes.number.isRequired,
  totalEntities: PropTypes.number.isRequired,
  assignedEntities: PropTypes.number.isRequired,
  totalAssignments: PropTypes.number.isRequired,
  conflicts: PropTypes.number
};
