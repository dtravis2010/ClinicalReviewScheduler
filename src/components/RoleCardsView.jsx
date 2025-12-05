import { useState } from 'react';
import { ChevronDown, ChevronUp, User, Layers } from 'lucide-react';

/**
 * Role Cards View - Alternate schedule visualization grouped by role
 * 
 * Phase 3 Premium Polish Feature:
 * - Cards grouped by role instead of grid
 * - Card drop shadows
 * - Color-coded headers
 * - Expand/collapse animations
 * - Week-based grouping
 */
export default function RoleCardsView({
  employees = [],
  assignments = {},
  darEntities = {},
  startDate,
  endDate,
}) {
  const [expandedRoles, setExpandedRoles] = useState({
    DAR: true,
    CR: true,
    CPOE: true,
    Float: true,
    Fax: true,
  });

  // Role configurations with colors and icons
  const roleConfig = {
    DAR: {
      label: 'Daily Assignment Review',
      shortLabel: 'DAR',
      color: 'from-role-dar to-blue-600',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-l-role-dar',
      textColor: 'text-role-dar',
    },
    CR: {
      label: 'Clinical Review',
      shortLabel: 'CR',
      color: 'from-role-cr to-green-600',
      bgLight: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-l-role-cr',
      textColor: 'text-role-cr',
    },
    CPOE: {
      label: 'Computerized Provider Order Entry',
      shortLabel: 'CPOE',
      color: 'from-role-cpoe to-purple-600',
      bgLight: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-l-role-cpoe',
      textColor: 'text-role-cpoe',
    },
    Float: {
      label: 'Float Coverage',
      shortLabel: 'Float',
      color: 'from-role-float to-gray-600',
      bgLight: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-l-role-float',
      textColor: 'text-role-float',
    },
    Fax: {
      label: 'Fax Processing',
      shortLabel: 'Fax',
      color: 'from-role-fax to-orange-600',
      bgLight: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-l-role-fax',
      textColor: 'text-role-fax',
    },
  };

  // Toggle role expansion
  const toggleRole = (role) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  // Get employees assigned to a specific role
  const getEmployeesForRole = (role) => {
    const result = [];
    
    employees.filter(e => !e.archived).forEach(employee => {
      const assignment = assignments[employee.id] || {};
      
      if (role === 'DAR' && assignment.dars?.length > 0) {
        result.push({
          ...employee,
          assignedEntities: assignment.dars.map(idx => darEntities[idx] || `DAR ${idx + 1}`),
        });
      } else if (role === 'CPOE' && assignment.cpoe) {
        result.push({
          ...employee,
          assignedEntities: Array.isArray(assignment.cpoe) ? assignment.cpoe : [assignment.cpoe],
        });
      } else if (role === 'CR' && assignment.crossTraining) {
        result.push({
          ...employee,
          assignedEntities: Array.isArray(assignment.crossTraining) ? assignment.crossTraining : [assignment.crossTraining],
        });
      } else if (role === 'Float' && employee.skills?.includes('Float')) {
        result.push({
          ...employee,
          assignedEntities: ['All Areas'],
        });
      }
    });
    
    return result;
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-green-500/10 flex items-center justify-center">
          <Layers className="w-5 h-5 text-thr-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Role Cards View</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {startDate && endDate ? `${startDate} to ${endDate}` : 'Schedule by Role'}
          </p>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(roleConfig).map(([role, config]) => {
          const assignedEmployees = getEmployeesForRole(role);
          const isExpanded = expandedRoles[role];
          
          return (
            <div
              key={role}
              className={`card overflow-hidden transition-all duration-300 ${config.borderColor} border-l-4 ${
                isExpanded ? 'shadow-card-hover' : 'shadow-card'
              }`}
            >
              {/* Card Header - Full width using negative margin compensation */}
              <button
                onClick={() => toggleRole(role)}
                className={`w-[calc(100%+3rem)] flex items-center justify-between p-4 ${config.bgLight} -mx-6 -mt-6 mb-4 transition-colors hover:opacity-90`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shadow-soft`}>
                    <span className="text-white text-xs font-bold">{config.shortLabel.charAt(0)}</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{config.shortLabel}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {assignedEmployees.length} assigned
                    </p>
                  </div>
                </div>
                <div className={`p-1 rounded-lg ${config.bgLight} transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
              </button>

              {/* Card Content - Expandable */}
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {assignedEmployees.length > 0 ? (
                  <div className="space-y-2">
                    {assignedEmployees.map((employee, idx) => (
                      <div
                        key={employee.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-150 hover:shadow-soft cursor-pointer ${
                          idx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-700/30' : 'bg-white dark:bg-slate-800'
                        }`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-thr-blue-500 to-thr-green-500 flex items-center justify-center flex-shrink-0 shadow-soft">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {employee.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {employee.assignedEntities?.slice(0, 3).join(', ')}
                            {employee.assignedEntities?.length > 3 && ` +${employee.assignedEntities.length - 3} more`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      No employees assigned
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Coverage:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {employees.filter(e => !e.archived).length} employees
            </span>
          </div>
          <div className="flex items-center gap-4">
            {Object.entries(roleConfig).map(([role, config]) => {
              const count = getEmployeesForRole(role).length;
              return (
                <div key={role} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${config.color}`} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {config.shortLabel}: {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
