import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Zap, TrendingDown, TrendingUp, ArrowRightLeft, AlertCircle, CheckCircle, X, Play } from 'lucide-react';
import Button from './atoms/Button';

/**
 * Workload Optimizer
 * AI-powered automatic workload rebalancing
 *
 * Features:
 * - Analyzes workload distribution
 * - Suggests optimal swaps to balance workload
 * - Preview changes before applying
 * - One-click auto-balance
 * - Respects skill constraints
 * - Minimizes disruption (fewest moves)
 */

const WorkloadOptimizer = ({
  employees = [],
  currentAssignments = {},
  onApplyOptimization,
  onClose,
}) => {
  const [selectedSwaps, setSelectedSwaps] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Calculate workload for an employee
  const calculateWorkload = useCallback((employeeId) => {
    const assignment = currentAssignments[employeeId] || {};
    let score = 0;
    score += (assignment.dars?.length || 0) * 3;
    score += (assignment.newIncoming?.length || 0) * 2;
    score += (assignment.crossTraining?.length || 0) * 1.5;
    score += assignment.cpoe ? 2 : 0;
    score += assignment.specialProjects ? 1 : 0;
    return score;
  }, [currentAssignments]);

  // Get workload stats
  const workloadStats = useMemo(() => {
    const workloads = employees
      .filter(emp => !emp.archived)
      .map(emp => ({
        employeeId: emp.id,
        employeeName: emp.name,
        workload: calculateWorkload(emp.id),
        employee: emp,
      }));

    const scores = workloads.map(w => w.workload);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length || 0;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return {
      workloads,
      avg,
      min,
      max,
      stdDev,
      imbalanceScore: stdDev / avg || 0, // 0-1, higher = more imbalanced
    };
  }, [employees, calculateWorkload]);

  // Generate optimization suggestions
  const optimizationSuggestions = useMemo(() => {
    const suggestions = [];
    const { workloads, avg } = workloadStats;

    // Find overloaded and underloaded employees
    const overloaded = workloads.filter(w => w.workload > avg * 1.2);
    const underloaded = workloads.filter(w => w.workload < avg * 0.8);

    if (overloaded.length === 0 || underloaded.length === 0) {
      return []; // Already balanced
    }

    // Generate swap suggestions
    overloaded.forEach(overEmp => {
      const overAssignment = currentAssignments[overEmp.employeeId] || {};

      underloaded.forEach(underEmp => {
        const underAssignment = currentAssignments[underEmp.employeeId] || {};

        // Try to find swappable assignments
        const swappableFields = ['newIncoming', 'crossTraining', 'specialProjects'];

        swappableFields.forEach(field => {
          if (field === 'specialProjects') {
            // For boolean fields, check if we can swap
            if (overAssignment[field] && !underAssignment[field]) {
              suggestions.push({
                id: `${overEmp.employeeId}-${underEmp.employeeId}-${field}`,
                type: 'transfer',
                from: overEmp,
                to: underEmp,
                field,
                value: true,
                impact: {
                  fromBefore: overEmp.workload,
                  fromAfter: overEmp.workload - 1,
                  toBefore: underEmp.workload,
                  toAfter: underEmp.workload + 1,
                },
                balanceImprovement: Math.abs(overEmp.workload - avg) + Math.abs(underEmp.workload - avg) -
                                   (Math.abs(overEmp.workload - 1 - avg) + Math.abs(underEmp.workload + 1 - avg)),
              });
            }
          } else {
            // For array fields, try to transfer items
            const items = overAssignment[field] || [];
            items.forEach((item, idx) => {
              // Check if this would be a good swap
              const pointValue = field === 'newIncoming' ? 2 : 1.5;
              const fromAfter = overEmp.workload - pointValue;
              const toAfter = underEmp.workload + pointValue;

              // Only suggest if it improves balance
              if (Math.abs(fromAfter - avg) < Math.abs(overEmp.workload - avg) &&
                  Math.abs(toAfter - avg) < Math.abs(underEmp.workload - avg)) {
                suggestions.push({
                  id: `${overEmp.employeeId}-${underEmp.employeeId}-${field}-${idx}`,
                  type: 'transfer',
                  from: overEmp,
                  to: underEmp,
                  field,
                  value: item,
                  valueIndex: idx,
                  impact: {
                    fromBefore: overEmp.workload,
                    fromAfter,
                    toBefore: underEmp.workload,
                    toAfter,
                  },
                  balanceImprovement: Math.abs(overEmp.workload - avg) + Math.abs(underEmp.workload - avg) -
                                     (Math.abs(fromAfter - avg) + Math.abs(toAfter - avg)),
                });
              }
            });
          }
        });

        // Try CPOE swap
        if (overAssignment.cpoe && !underAssignment.cpoe) {
          // Check if underEmp has CPOE skill
          if (underEmp.employee.skills?.includes('CPOE') || underEmp.employee.skills?.includes('Float')) {
            const fromAfter = overEmp.workload - 2;
            const toAfter = underEmp.workload + 2;

            suggestions.push({
              id: `${overEmp.employeeId}-${underEmp.employeeId}-cpoe`,
              type: 'transfer',
              from: overEmp,
              to: underEmp,
              field: 'cpoe',
              value: true,
              impact: {
                fromBefore: overEmp.workload,
                fromAfter,
                toBefore: underEmp.workload,
                toAfter,
              },
              balanceImprovement: Math.abs(overEmp.workload - avg) + Math.abs(underEmp.workload - avg) -
                                 (Math.abs(fromAfter - avg) + Math.abs(toAfter - avg)),
              requiresSkill: 'CPOE',
            });
          }
        }
      });
    });

    // Sort by balance improvement (highest first)
    return suggestions
      .filter(s => s.balanceImprovement > 0)
      .sort((a, b) => b.balanceImprovement - a.balanceImprovement)
      .slice(0, 10); // Top 10 suggestions
  }, [workloadStats, currentAssignments]);

  // Calculate projected stats after applying selected swaps
  const projectedStats = useMemo(() => {
    if (selectedSwaps.length === 0) return workloadStats;

    // Clone current assignments
    const projected = JSON.parse(JSON.stringify(currentAssignments));

    // Apply selected swaps
    selectedSwaps.forEach(swapId => {
      const swap = optimizationSuggestions.find(s => s.id === swapId);
      if (!swap) return;

      const fromAssignment = projected[swap.from.employeeId] || {};
      const toAssignment = projected[swap.to.employeeId] || {};

      if (swap.field === 'cpoe' || swap.field === 'specialProjects') {
        // Boolean field
        fromAssignment[swap.field] = false;
        toAssignment[swap.field] = true;
      } else {
        // Array field
        const items = fromAssignment[swap.field] || [];
        const newItems = items.filter((_, idx) => idx !== swap.valueIndex);
        fromAssignment[swap.field] = newItems;
        toAssignment[swap.field] = [...(toAssignment[swap.field] || []), swap.value];
      }

      projected[swap.from.employeeId] = fromAssignment;
      projected[swap.to.employeeId] = toAssignment;
    });

    // Recalculate stats
    const calcWorkload = (empId) => {
      const assignment = projected[empId] || {};
      let score = 0;
      score += (assignment.dars?.length || 0) * 3;
      score += (assignment.newIncoming?.length || 0) * 2;
      score += (assignment.crossTraining?.length || 0) * 1.5;
      score += assignment.cpoe ? 2 : 0;
      score += assignment.specialProjects ? 1 : 0;
      return score;
    };

    const workloads = employees
      .filter(emp => !emp.archived)
      .map(emp => ({
        employeeId: emp.id,
        employeeName: emp.name,
        workload: calcWorkload(emp.id),
      }));

    const scores = workloads.map(w => w.workload);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length || 0;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return {
      workloads,
      avg,
      stdDev,
      imbalanceScore: stdDev / avg || 0,
    };
  }, [selectedSwaps, optimizationSuggestions, currentAssignments, employees]);

  // Toggle swap selection
  const toggleSwap = (swapId) => {
    setSelectedSwaps(prev =>
      prev.includes(swapId)
        ? prev.filter(id => id !== swapId)
        : [...prev, swapId]
    );
  };

  // Auto-select optimal swaps
  const autoSelectOptimal = () => {
    // Greedily select swaps that improve balance without conflicts
    const selected = [];
    const appliedEmployees = new Set();

    optimizationSuggestions.forEach(swap => {
      // Check if either employee already has a swap applied
      if (appliedEmployees.has(swap.from.employeeId) || appliedEmployees.has(swap.to.employeeId)) {
        return;
      }

      selected.push(swap.id);
      appliedEmployees.add(swap.from.employeeId);
      appliedEmployees.add(swap.to.employeeId);
    });

    setSelectedSwaps(selected);
    setPreviewMode(true);
  };

  // Apply optimization
  const handleApply = () => {
    const swaps = selectedSwaps.map(id =>
      optimizationSuggestions.find(s => s.id === id)
    ).filter(Boolean);

    onApplyOptimization?.(swaps);
  };

  const balanceImprovement = ((workloadStats.imbalanceScore - projectedStats.imbalanceScore) / workloadStats.imbalanceScore * 100) || 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg border border-slate-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Workload Optimizer
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            AI-powered automatic workload rebalancing
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Close optimizer"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Current State */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Current Workload Distribution
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Average</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {workloadStats.avg.toFixed(1)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Std Dev</div>
            <div className="text-xl font-bold text-orange-700 dark:text-orange-400">
              {workloadStats.stdDev.toFixed(1)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Imbalance</div>
            <div className={`text-xl font-bold ${
              workloadStats.imbalanceScore > 0.3 ? 'text-red-700 dark:text-red-400' :
              workloadStats.imbalanceScore > 0.15 ? 'text-yellow-700 dark:text-yellow-400' :
              'text-green-700 dark:text-green-400'
            }`}>
              {(workloadStats.imbalanceScore * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Status */}
      {optimizationSuggestions.length === 0 ? (
        <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="font-semibold text-green-900 dark:text-green-200 mb-1">
            Workload is Already Balanced!
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            No optimization needed at this time.
          </p>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                  {optimizationSuggestions.length} Optimization{optimizationSuggestions.length !== 1 ? 's' : ''} Available
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Potential balance improvement: {balanceImprovement.toFixed(0)}%
                </p>
              </div>

              <Button
                variant="primary"
                icon={<Play />}
                onClick={autoSelectOptimal}
              >
                Auto-Optimize
              </Button>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Suggested Swaps
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {optimizationSuggestions.map((swap) => {
                const isSelected = selectedSwaps.includes(swap.id);

                return (
                  <div
                    key={swap.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-thr-blue-500 bg-thr-blue-50 dark:bg-thr-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                    onClick={() => toggleSwap(swap.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-thr-blue-600 border-thr-blue-600'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {swap.from.employeeName}
                          </span>
                          <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {swap.to.employeeName}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Transfer <span className="font-medium">{swap.value === true ? swap.field : swap.value}</span> ({swap.field})
                        </p>

                        {/* Impact */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <TrendingDown className="w-3 h-3 text-green-600" />
                              {swap.from.employeeName}
                            </div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {swap.impact.fromBefore.toFixed(1)} → {swap.impact.fromAfter.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <TrendingUp className="w-3 h-3 text-blue-600" />
                              {swap.to.employeeName}
                            </div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {swap.impact.toBefore.toFixed(1)} → {swap.impact.toAfter.toFixed(1)}
                            </div>
                          </div>
                        </div>

                        {swap.requiresSkill && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <AlertCircle className="w-3 h-3" />
                            Requires {swap.requiresSkill} skill
                          </div>
                        )}
                      </div>

                      {/* Balance improvement */}
                      <div className="text-right">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Improvement
                        </div>
                        <div className="text-lg font-bold text-green-700 dark:text-green-400">
                          +{swap.balanceImprovement.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Projected Results */}
          {selectedSwaps.length > 0 && (
            <div className="mb-6 p-4 bg-thr-blue-50 dark:bg-thr-blue-900/20 rounded-lg border border-thr-blue-200 dark:border-thr-blue-800">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Projected After Optimization
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Average</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {projectedStats.avg.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Std Dev</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-400">
                    {projectedStats.stdDev.toFixed(1)} ↓
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Imbalance</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-400">
                    {(projectedStats.imbalanceScore * 100).toFixed(0)}% ↓
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {selectedSwaps.length} swap{selectedSwaps.length !== 1 ? 's' : ''} selected
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedSwaps([])}
                disabled={selectedSwaps.length === 0}
              >
                Clear Selection
              </Button>
              <Button
                variant="primary"
                icon={<CheckCircle />}
                onClick={handleApply}
                disabled={selectedSwaps.length === 0}
              >
                Apply {selectedSwaps.length} Swap{selectedSwaps.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

WorkloadOptimizer.propTypes = {
  employees: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentAssignments: PropTypes.object.isRequired,
  onApplyOptimization: PropTypes.func,
  onClose: PropTypes.func,
};

export default WorkloadOptimizer;
