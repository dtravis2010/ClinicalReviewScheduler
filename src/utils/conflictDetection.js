/**
 * Conflict detection utilities for schedule validation
 * Detects skill mismatches, workload imbalances, and assignment conflicts
 */

import { hasSpecialProjects } from './scheduleUtils.js';

/**
 * Detect all conflicts in a schedule
 * @param {Object} assignments - Employee assignments { employeeId: { dars: [], cpoe: bool, ... } }
 * @param {Array} employees - List of employees with skills
 * @param {Object} darEntities - DAR column entity assignments
 * @returns {Object} Conflicts and warnings
 */
export function detectConflicts(assignments, employees, darEntities = {}) {
  const conflicts = [];
  const warnings = [];

  if (!assignments || !employees) {
    return { conflicts, warnings, hasIssues: false };
  }

  // Create employee lookup map
  const employeeMap = new Map();
  employees.forEach(emp => {
    if (emp && emp.id) {
      employeeMap.set(emp.id, emp);
    }
  });

  // Check each assignment
  Object.entries(assignments).forEach(([employeeId, assignment]) => {
    const employee = employeeMap.get(employeeId);
    if (!employee) return;

    // Check DAR assignments for skill mismatch
    if (assignment.dars && Array.isArray(assignment.dars)) {
      assignment.dars.forEach(darIndex => {
        const hasSkill = employee.skills?.includes('DAR') || employee.skills?.includes('Float');
        if (!hasSkill) {
          conflicts.push({
            type: 'skill_mismatch',
            severity: 'error',
            employeeId,
            employeeName: employee.name,
            field: 'dars',
            darIndex,
            message: `${employee.name} is assigned to DAR ${darIndex + 1} but lacks DAR or Float skill`
          });
        }
      });

      // Check for multiple DAR assignments (warning)
      if (assignment.dars.length > 1) {
        warnings.push({
          type: 'multiple_dars',
          severity: 'warning',
          employeeId,
          employeeName: employee.name,
          field: 'dars',
          count: assignment.dars.length,
          message: `${employee.name} is assigned to ${assignment.dars.length} DAR columns`
        });
      }
    }

    // Check CPOE assignment for skill mismatch
    if (assignment.cpoe) {
      const hasSkill = employee.skills?.includes('CPOE');
      if (!hasSkill) {
        conflicts.push({
          type: 'skill_mismatch',
          severity: 'error',
          employeeId,
          employeeName: employee.name,
          field: 'cpoe',
          message: `${employee.name} is assigned to CPOE but lacks CPOE skill`
        });
      }
    }

    // Check for multiple entity assignments in different fields (warning)
    const assignedEntities = [];
    ['newIncoming', 'crossTraining'].forEach(field => {
      if (assignment[field]) {
        const entities = Array.isArray(assignment[field]) ? assignment[field] : [assignment[field]];
        entities.forEach(entity => {
          if (entity) assignedEntities.push({ field, entity });
        });
      }
    });

    if (assignedEntities.length > 1) {
      warnings.push({
        type: 'multiple_entities',
        severity: 'warning',
        employeeId,
        employeeName: employee.name,
        count: assignedEntities.length,
        entities: assignedEntities,
        message: `${employee.name} is assigned to ${assignedEntities.length} different entities`
      });
    }
  });

  return {
    conflicts,
    warnings,
    hasIssues: conflicts.length > 0 || warnings.length > 0
  };
}

/**
 * Calculate workload for an employee
 * @param {Object} assignment - Employee assignment
 * @param {Object} darEntities - DAR column entity assignments
 * @returns {number} Workload score
 */
export function calculateWorkload(assignment, darEntities = {}) {
  if (!assignment) return 0;

  let workload = 0;

  // DAR assignments: 3 points each
  if (assignment.dars && Array.isArray(assignment.dars)) {
    workload += assignment.dars.length * 3;
  }

  // CPOE: 2 points
  if (assignment.cpoe) {
    workload += 2;
  }

  // New Incoming: 2 points per entity
  if (assignment.newIncoming) {
    const count = Array.isArray(assignment.newIncoming) 
      ? assignment.newIncoming.length 
      : (assignment.newIncoming ? 1 : 0);
    workload += count * 2;
  }

  // Cross-Training: 1 point per entity
  if (assignment.crossTraining) {
    const count = Array.isArray(assignment.crossTraining) 
      ? assignment.crossTraining.length 
      : (assignment.crossTraining ? 1 : 0);
    workload += count * 1;
  }

  // Special Projects: 1 point if assigned
  if (hasSpecialProjects(assignment.specialProjects)) {
    workload += 1;
  }

  return workload;
}

/**
 * Detect workload imbalances across employees
 * @param {Object} assignments - Employee assignments
 * @param {Array} employees - List of employees
 * @param {Object} darEntities - DAR column entity assignments
 * @returns {Object} Workload analysis
 */
export function detectWorkloadImbalances(assignments, employees, darEntities = {}) {
  if (!assignments || !employees) {
    return { imbalances: [], workloadMap: new Map(), avgWorkload: 0 };
  }

  const workloadMap = new Map();
  let totalWorkload = 0;
  let activeEmployeeCount = 0;

  // Calculate workload for each employee
  employees.forEach(employee => {
    if (employee && !employee.archived) {
      const assignment = assignments[employee.id] || {};
      const workload = calculateWorkload(assignment, darEntities);
      workloadMap.set(employee.id, {
        employeeId: employee.id,
        employeeName: employee.name,
        workload,
        assignment
      });
      totalWorkload += workload;
      activeEmployeeCount++;
    }
  });

  const avgWorkload = activeEmployeeCount > 0 ? totalWorkload / activeEmployeeCount : 0;
  const imbalances = [];

  // Detect imbalances (workload > 150% of average or < 50% of average)
  workloadMap.forEach((data, employeeId) => {
    if (avgWorkload > 0) {
      const ratio = data.workload / avgWorkload;
      
      if (ratio > 1.5) {
        imbalances.push({
          type: 'overloaded',
          severity: 'warning',
          employeeId,
          employeeName: data.employeeName,
          workload: data.workload,
          avgWorkload,
          ratio,
          message: `${data.employeeName} has ${Math.round(ratio * 100)}% of average workload (overloaded)`
        });
      } else if (ratio < 0.5 && data.workload > 0) {
        imbalances.push({
          type: 'underloaded',
          severity: 'info',
          employeeId,
          employeeName: data.employeeName,
          workload: data.workload,
          avgWorkload,
          ratio,
          message: `${data.employeeName} has ${Math.round(ratio * 100)}% of average workload (underloaded)`
        });
      }
    }
  });

  return {
    imbalances,
    workloadMap,
    avgWorkload
  };
}
