import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Building2, Users, AlertCircle, Clock } from 'lucide-react';
import AssignmentInfoPanel from './AssignmentInfoPanel';
import { calculateEntityStats } from '../../utils/assignmentStats';
import { getEntityShortCode } from '../../utils/scheduleUtils';
import { formatHistoryDate } from '../../utils/entityHistory';

/**
 * Info panel showing entity assignment history and statistics
 * Reusable for both New Incoming and Cross-Training
 */
export default function EntityInfoPanel({
  isOpen,
  onClose,
  assignmentType,
  entities,
  employees,
  currentAssignments,
  schedules
}) {
  // Calculate statistics (memoized for performance)
  const stats = useMemo(
    () => calculateEntityStats(schedules, entities, employees, assignmentType),
    [schedules, entities, employees, assignmentType]
  );

  // Get title based on assignment type
  const title = assignmentType === 'newIncoming' ? 'New Incoming History' : 'Cross-Training History';

  // Separate assigned and never assigned entities
  const assignedEntities = stats.filter(e => !e.neverAssigned);
  const neverAssignedEntities = stats.filter(e => e.neverAssigned);

  // Get current schedule assignments
  const currentEntityAssignments = useMemo(() => {
    if (!currentAssignments) return new Set();
    
    const entitySet = new Set();
    Object.values(currentAssignments).forEach(assignment => {
      const entityList = assignment[assignmentType];
      if (entityList) {
        const entities = Array.isArray(entityList) ? entityList : [entityList];
        entities.forEach(e => entitySet.add(e));
      }
    });
    return entitySet;
  }, [currentAssignments, assignmentType]);

  return (
    <AssignmentInfoPanel isOpen={isOpen} onClose={onClose} title={title}>
      {/* Statistics Summary */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-thr-blue-600 dark:text-thr-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Entity Statistics</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-thr-blue-600 dark:text-thr-blue-400">
              {entities.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Entities</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-thr-green-600 dark:text-thr-green-400">
              {assignedEntities.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Assigned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {neverAssignedEntities.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Never Assigned</div>
          </div>
        </div>
      </div>

      {/* Assigned Entities */}
      {assignedEntities.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Assignment History
            </h3>
          </div>
          <div className="space-y-3">
            {assignedEntities.map((entity, idx) => {
              const abbrev = getEntityShortCode([entity.entityName]);
              const isCurrent = currentEntityAssignments.has(entity.entityName);
              
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    isCurrent
                      ? 'bg-thr-green-50 dark:bg-thr-green-900/20 border-thr-green-200 dark:border-thr-green-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Entity Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-thr-blue-600 dark:text-thr-blue-400">
                          {abbrev}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {entity.entityName}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-thr-green-100 dark:bg-thr-green-900/40 text-thr-green-700 dark:text-thr-green-300 text-xs font-medium rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {entity.totalAssignments}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        assignment{entity.totalAssignments !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Employee Breakdown */}
                  {entity.employees.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Employees
                        </span>
                      </div>
                      <div className="space-y-2">
                        {entity.employees.map((emp, empIdx) => (
                          <div
                            key={empIdx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-slate-700 dark:text-slate-300">
                              {emp.employeeName}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600 dark:text-slate-400">
                                {emp.count}x
                              </span>
                              {emp.lastAssigned && (
                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-xs">
                                    {formatHistoryDate(emp.lastAssigned)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Never Assigned Entities */}
      {neverAssignedEntities.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-orange-900 dark:text-orange-100">
              Never Assigned
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {neverAssignedEntities.map((entity, idx) => {
              const abbrev = getEntityShortCode([entity.entityName]);
              return (
                <div
                  key={idx}
                  className="px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                  title={entity.entityName}
                >
                  {abbrev}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {assignedEntities.length === 0 && neverAssignedEntities.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No entity assignments found</p>
          <p className="text-sm mt-1">Assignments will appear here after saving schedules</p>
        </div>
      )}
    </AssignmentInfoPanel>
  );
}

EntityInfoPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  assignmentType: PropTypes.oneOf(['newIncoming', 'crossTraining']).isRequired,
  entities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
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
