import { useMemo } from 'react';
import { detectConflicts, detectWorkloadImbalances } from '../utils/conflictDetection';

/**
 * Hook for detecting conflicts and workload imbalances in schedule assignments
 * @param {Object} assignments - Employee assignments
 * @param {Array} employees - List of employees
 * @param {Object} darEntities - DAR column entity assignments
 * @returns {Object} Conflict detection results
 */
export function useConflictDetection(assignments, employees, darEntities) {
  const results = useMemo(() => {
    const conflictResults = detectConflicts(assignments, employees, darEntities);
    const workloadResults = detectWorkloadImbalances(assignments, employees, darEntities);

    return {
      conflicts: conflictResults.conflicts,
      warnings: conflictResults.warnings,
      workloadImbalances: workloadResults.imbalances,
      workloadMap: workloadResults.workloadMap,
      avgWorkload: workloadResults.avgWorkload,
      hasIssues: conflictResults.hasIssues || workloadResults.imbalances.length > 0,
      totalIssues: conflictResults.conflicts.length + conflictResults.warnings.length + workloadResults.imbalances.length
    };
  }, [assignments, employees, darEntities]);

  return results;
}
