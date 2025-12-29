import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, CheckCircle, ArrowRight, Zap, X, Undo } from 'lucide-react';
import Button from './atoms/Button';

/**
 * Conflict Auto-Resolver
 * Automatically generates fixes for detected scheduling conflicts
 *
 * Handles:
 * - Skill mismatches (finds replacement with correct skill)
 * - Workload imbalances (suggests swaps)
 * - Multiple entity assignments (suggests consolidation)
 * - Double booking (removes duplicates)
 */

const ConflictAutoResolver = ({
  conflicts = [],
  employees = [],
  currentAssignments = {},
  onApplyFix,
  onApplyAll,
  onDismiss,
}) => {
  const [appliedFixes, setAppliedFixes] = useState(new Set());
  const [previewingFix, setPreviewingFix] = useState(null);

  // Calculate workload for employee
  const calculateWorkload = (employeeId) => {
    const assignment = currentAssignments[employeeId] || {};
    let score = 0;
    score += (assignment.dars?.length || 0) * 3;
    score += (assignment.newIncoming?.length || 0) * 2;
    score += (assignment.crossTraining?.length || 0) * 1.5;
    score += assignment.cpoe ? 2 : 0;
    return score;
  };

  // Get average workload
  const averageWorkload = useMemo(() => {
    const workloads = employees.map(emp => calculateWorkload(emp.id));
    return workloads.reduce((sum, w) => sum + w, 0) / employees.length || 0;
  }, [employees, currentAssignments]);

  // Generate fix suggestions for each conflict
  const conflictsWithFixes = useMemo(() => {
    return conflicts.map(conflict => {
      const fixes = [];

      switch (conflict.type) {
        case 'skill_mismatch': {
          // Find employees with correct skill
          const requiredSkill = conflict.field === 'dars' ? 'DAR' :
                               conflict.field === 'cpoe' ? 'CPOE' : 'Float';

          const replacements = employees
            .filter(emp =>
              !emp.archived &&
              emp.id !== conflict.employeeId &&
              (emp.skills?.includes(requiredSkill) || emp.skills?.includes('Float'))
            )
            .map(emp => {
              const workload = calculateWorkload(emp.id);
              const workloadScore = averageWorkload > 0 ?
                1 - Math.abs(workload - averageWorkload) / averageWorkload : 0.5;

              return {
                type: 'swap',
                description: `Replace ${conflict.employeeName} with ${emp.name}`,
                action: {
                  remove: { employeeId: conflict.employeeId, field: conflict.field, darIndex: conflict.darIndex },
                  add: { employeeId: emp.id, field: conflict.field, darIndex: conflict.darIndex },
                },
                impact: [
                  `✓ Resolves skill mismatch`,
                  `${emp.name} workload: ${workload.toFixed(1)} (${workloadScore > 0.8 ? 'good' : 'acceptable'})`
                ],
                confidence: workloadScore,
                employee: emp,
              };
            })
            .sort((a, b) => b.confidence - a.confidence);

          fixes.push(...replacements.slice(0, 3)); // Top 3 replacements
          break;
        }

        case 'workload_imbalance': {
          // Find underutilized employees to swap with
          const overloadedWorkload = calculateWorkload(conflict.employeeId);

          const swapCandidates = employees
            .filter(emp => {
              if (emp.archived || emp.id === conflict.employeeId) return false;
              const workload = calculateWorkload(emp.id);
              return workload < averageWorkload * 0.7; // Underutilized
            })
            .map(emp => {
              const empWorkload = calculateWorkload(emp.id);
              const empAssignment = currentAssignments[emp.id] || {};
              const conflictAssignment = currentAssignments[conflict.employeeId] || {};

              // Find an assignment to swap
              let swapField = null;
              let swapValue = null;

              if (conflictAssignment.newIncoming?.length > 0) {
                swapField = 'newIncoming';
                swapValue = conflictAssignment.newIncoming[0];
              } else if (conflictAssignment.crossTraining?.length > 0) {
                swapField = 'crossTraining';
                swapValue = conflictAssignment.crossTraining[0];
              }

              if (!swapField) return null;

              return {
                type: 'swap',
                description: `Move ${swapValue} from ${conflict.employeeName} to ${emp.name}`,
                action: {
                  from: { employeeId: conflict.employeeId, field: swapField, value: swapValue },
                  to: { employeeId: emp.id, field: swapField, value: swapValue },
                },
                impact: [
                  `${conflict.employeeName}: ${overloadedWorkload.toFixed(1)} → ${(overloadedWorkload - 2).toFixed(1)}`,
                  `${emp.name}: ${empWorkload.toFixed(1)} → ${(empWorkload + 2).toFixed(1)}`,
                  `✓ Improves balance`
                ],
                confidence: 0.8,
                employee: emp,
              };
            })
            .filter(Boolean);

          fixes.push(...swapCandidates.slice(0, 2));
          break;
        }

        case 'double_assignment': {
          // Simply remove the duplicate
          fixes.push({
            type: 'remove',
            description: `Remove duplicate assignment`,
            action: {
              remove: { employeeId: conflict.employeeId, field: conflict.field, value: conflict.entity },
            },
            impact: [
              `✓ Removes duplicate`,
              `No workload change`
            ],
            confidence: 1.0,
          });
          break;
        }

        default:
          break;
      }

      return {
        ...conflict,
        fixes,
      };
    });
  }, [conflicts, employees, currentAssignments, averageWorkload]);

  const handleApplyFix = (conflictId, fix) => {
    onApplyFix?.(conflictId, fix);
    setAppliedFixes(prev => new Set([...prev, conflictId]));
  };

  const handleApplyAll = () => {
    const allFixes = conflictsWithFixes
      .filter(c => c.fixes.length > 0 && !appliedFixes.has(c.id))
      .map(c => ({ conflictId: c.id, fix: c.fixes[0] })); // Use top fix for each

    onApplyAll?.(allFixes);
    setAppliedFixes(new Set(conflictsWithFixes.map(c => c.id)));
  };

  const unresolvedConflicts = conflictsWithFixes.filter(c => !appliedFixes.has(c.id));

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg border-2 border-red-200 dark:border-red-800 p-6 animate-slideInDown">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {unresolvedConflicts.length} Conflict{unresolvedConflicts.length !== 1 && 's'} Detected
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            AI-powered fixes available for automatic resolution
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Close resolver"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Bulk Actions */}
      {unresolvedConflicts.length > 1 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-thr-blue-50 to-thr-green-50 dark:from-thr-blue-900/20 dark:to-thr-green-900/20 rounded-lg border border-thr-blue-200 dark:border-thr-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-thr-blue-600" />
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Quick Fix All
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Apply top recommendation for each conflict
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              icon={<Zap />}
              onClick={handleApplyAll}
            >
              Apply All Fixes
            </Button>
          </div>
        </div>
      )}

      {/* Conflicts List */}
      <div className="space-y-6">
        {conflictsWithFixes.map((conflict) => {
          const isResolved = appliedFixes.has(conflict.id);

          return (
            <div
              key={conflict.id}
              className={`p-5 rounded-lg border-2 transition-all ${
                isResolved
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : conflict.severity === 'critical'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              }`}
            >
              {/* Conflict Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isResolved ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className={`w-5 h-5 ${
                        conflict.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                      }`} />
                    )}
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {conflict.message}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 ml-7">
                    {conflict.employeeName} • {conflict.field}
                  </p>
                </div>

                {isResolved && (
                  <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                    Fixed
                  </span>
                )}
              </div>

              {/* Auto-Fix Options */}
              {!isResolved && conflict.fixes.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Suggested Fixes:
                  </p>

                  {conflict.fixes.map((fix, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        previewingFix === `${conflict.id}-${idx}`
                          ? 'border-thr-blue-500 bg-thr-blue-50 dark:bg-thr-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/50'
                      }`}
                      onMouseEnter={() => setPreviewingFix(`${conflict.id}-${idx}`)}
                      onMouseLeave={() => setPreviewingFix(null)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowRight className="w-4 h-4 text-thr-blue-600" />
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {fix.description}
                            </p>
                            {idx === 0 && (
                              <span className="px-2 py-0.5 bg-thr-blue-600 text-white text-xs font-medium rounded">
                                Recommended
                              </span>
                            )}
                          </div>

                          {/* Impact */}
                          <div className="ml-6 space-y-1">
                            {fix.impact.map((impact, i) => (
                              <p key={i} className="text-sm text-slate-600 dark:text-slate-400">
                                {impact}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Confidence */}
                        <div className="ml-4">
                          <div className="text-xs text-slate-500 dark:text-slate-400 text-center mb-1">
                            Confidence
                          </div>
                          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                fix.confidence > 0.7 ? 'bg-green-500' :
                                fix.confidence > 0.4 ? 'bg-yellow-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${fix.confidence * 100}%` }}
                            />
                          </div>
                          <div className="text-xs text-center text-slate-600 dark:text-slate-400 mt-1">
                            {Math.round(fix.confidence * 100)}%
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={idx === 0 ? 'primary' : 'outline'}
                        onClick={() => handleApplyFix(conflict.id, fix)}
                        fullWidth
                      >
                        Apply This Fix
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!isResolved && conflict.fixes.length === 0 && (
                <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No automatic fix available. Manual resolution required.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {appliedFixes.size} of {conflicts.length} conflicts resolved
          </div>

          {appliedFixes.size > 0 && (
            <button
              onClick={() => setAppliedFixes(new Set())}
              className="flex items-center gap-2 text-sm text-thr-blue-600 hover:text-thr-blue-700 font-medium"
            >
              <Undo className="w-4 h-4" />
              Undo All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

ConflictAutoResolver.propTypes = {
  conflicts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    employeeId: PropTypes.string.isRequired,
    employeeName: PropTypes.string.isRequired,
    field: PropTypes.string.isRequired,
    darIndex: PropTypes.number,
    entity: PropTypes.string,
  })).isRequired,
  employees: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentAssignments: PropTypes.object.isRequired,
  onApplyFix: PropTypes.func,
  onApplyAll: PropTypes.func,
  onDismiss: PropTypes.func,
};

export default ConflictAutoResolver;
