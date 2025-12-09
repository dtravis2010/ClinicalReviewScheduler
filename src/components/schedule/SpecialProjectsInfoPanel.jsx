import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Briefcase, Users, Mail, Plane } from 'lucide-react';
import AssignmentInfoPanel from './AssignmentInfoPanel';
import { calculateSpecialProjectStats } from '../../utils/assignmentStats';

/**
 * Info panel showing special projects assignment distribution
 */
export default function SpecialProjectsInfoPanel({
  isOpen,
  onClose,
  employees,
  currentAssignments,
  schedules
}) {
  // Calculate statistics (memoized for performance)
  const stats = useMemo(
    () => calculateSpecialProjectStats(schedules, employees),
    [schedules, employees]
  );

  // Get current schedule special projects
  const currentProjects = useMemo(() => {
    if (!currentAssignments) return { threePEmail: [], threePBackupEmail: [], float: [], other: [] };
    
    const current = { threePEmail: [], threePBackupEmail: [], float: [], other: [] };
    
    Object.entries(currentAssignments).forEach(([employeeId, assignment]) => {
      const sp = assignment.specialProjects;
      if (!sp) return;

      const employee = employees.find(e => e.id === employeeId);
      const employeeName = employee?.name || 'Unknown';

      if (typeof sp === 'object' && !Array.isArray(sp)) {
        if (sp.threePEmail) current.threePEmail.push(employeeName);
        if (sp.threePBackupEmail) current.threePBackupEmail.push(employeeName);
        if (sp.float) current.float.push(employeeName);
        if (sp.other) current.other.push({ name: employeeName, project: sp.other });
      }
    });

    return current;
  }, [currentAssignments, employees]);

  const totalAssignments = stats.threePEmail.count + stats.threePBackupEmail.count + 
                          stats.float.count + stats.other.count;

  const ProjectTypeCard = ({ icon: Icon, title, stats, currentEmployees, color }) => (
    <div className={`p-4 rounded-lg border ${color.border} ${color.bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${color.icon}`} />
        <h4 className={`font-semibold ${color.text}`}>{title}</h4>
      </div>
      
      <div className="mb-3">
        <div className={`text-2xl font-bold ${color.accent}`}>
          {stats.count}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Total assignments
        </div>
      </div>

      {currentEmployees.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Current Schedule:
          </div>
          <div className="flex flex-wrap gap-1">
            {currentEmployees.map((name, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 ${color.badge} text-xs font-medium rounded-full`}
              >
                {typeof name === 'object' ? name.name : name}
              </span>
            ))}
          </div>
        </div>
      )}

      {stats.employees.length > 0 && (
        <div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Historical ({stats.employees.length} employee{stats.employees.length !== 1 ? 's' : ''}):
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {stats.employees.slice(0, 3).join(', ')}
            {stats.employees.length > 3 && ` +${stats.employees.length - 3} more`}
          </div>
        </div>
      )}

      {stats.projects && stats.projects.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Project Types:
          </div>
          <div className="flex flex-wrap gap-1">
            {stats.projects.map((project, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded"
              >
                {project}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AssignmentInfoPanel isOpen={isOpen} onClose={onClose} title="Special Projects History">
      {/* Statistics Summary */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-thr-blue-600 dark:text-thr-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-thr-blue-600 dark:text-thr-blue-400">
              {totalAssignments}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Assignments</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-thr-blue-600 dark:text-thr-blue-400">
              {new Set([
                ...stats.threePEmail.employees,
                ...stats.threePBackupEmail.employees,
                ...stats.float.employees,
                ...stats.other.employees
              ]).size}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Unique Employees</div>
          </div>
        </div>
      </div>

      {/* Project Type Breakdown */}
      <div className="space-y-4">
        <ProjectTypeCard
          icon={Mail}
          title="3P Email"
          stats={stats.threePEmail}
          currentEmployees={currentProjects.threePEmail}
          color={{
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            icon: 'text-blue-600 dark:text-blue-400',
            text: 'text-blue-900 dark:text-blue-100',
            accent: 'text-blue-600 dark:text-blue-400',
            badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
          }}
        />

        <ProjectTypeCard
          icon={Mail}
          title="3P Backup Email"
          stats={stats.threePBackupEmail}
          currentEmployees={currentProjects.threePBackupEmail}
          color={{
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            border: 'border-purple-200 dark:border-purple-800',
            icon: 'text-purple-600 dark:text-purple-400',
            text: 'text-purple-900 dark:text-purple-100',
            accent: 'text-purple-600 dark:text-purple-400',
            badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
          }}
        />

        <ProjectTypeCard
          icon={Plane}
          title="Float"
          stats={stats.float}
          currentEmployees={currentProjects.float}
          color={{
            bg: 'bg-thr-green-50 dark:bg-thr-green-900/20',
            border: 'border-thr-green-200 dark:border-thr-green-800',
            icon: 'text-thr-green-600 dark:text-thr-green-400',
            text: 'text-thr-green-900 dark:text-thr-green-100',
            accent: 'text-thr-green-600 dark:text-thr-green-400',
            badge: 'bg-thr-green-100 dark:bg-thr-green-900/40 text-thr-green-700 dark:text-thr-green-300'
          }}
        />

        <ProjectTypeCard
          icon={Briefcase}
          title="Other Projects"
          stats={stats.other}
          currentEmployees={currentProjects.other}
          color={{
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-200 dark:border-orange-800',
            icon: 'text-orange-600 dark:text-orange-400',
            text: 'text-orange-900 dark:text-orange-100',
            accent: 'text-orange-600 dark:text-orange-400',
            badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
          }}
        />
      </div>

      {/* Empty State */}
      {totalAssignments === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No special projects found in historical data</p>
          <p className="text-sm mt-1">Assignments will appear here after saving schedules</p>
        </div>
      )}
    </AssignmentInfoPanel>
  );
}

SpecialProjectsInfoPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  employees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  currentAssignments: PropTypes.object,
  schedules: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    assignments: PropTypes.object
  })).isRequired
};
