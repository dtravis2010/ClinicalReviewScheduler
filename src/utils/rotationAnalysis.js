/**
 * Rotation Analysis Utilities
 *
 * Functions for analyzing employee assignment rotation patterns to ensure fairness
 */

import { logger } from './logger';

/**
 * Calculate rotation metrics for all employees
 * Shows who is due for assignments to ensure fair rotation
 *
 * @param {Array} employees - Array of employee objects
 * @param {Array} schedules - Array of schedule objects (sorted newest first)
 * @param {number} lookbackLimit - Number of recent schedules to analyze (default: 10)
 * @returns {Array} Array of employee rotation data
 */
export function calculateEmployeeRotation(employees = [], schedules = [], lookbackLimit = 10) {
  if (!Array.isArray(employees) || !Array.isArray(schedules)) {
    logger.warn('Invalid inputs to calculateEmployeeRotation');
    return [];
  }

  // Filter only published schedules and sort by date (newest first)
  const publishedSchedules = schedules
    .filter(s => s.status === 'published' && s.startDate)
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .slice(0, lookbackLimit);

  if (publishedSchedules.length === 0) {
    logger.info('No published schedules found for rotation analysis');
    return employees.map(emp => ({
      ...emp,
      rotationData: {
        lastDarAssignment: null,
        lastNewIncomingAssignment: null,
        lastCrossTrainingAssignment: null,
        lastAnyAssignment: null,
        totalDarCount: 0,
        totalNewIncomingCount: 0,
        totalCrossTrainingCount: 0,
        totalAssignmentCount: 0,
        schedulesSinceLastDar: null,
        schedulesSinceLastNewIncoming: null,
        schedulesSinceLastAny: null,
        rotationScore: 0,
        rotationStatus: 'never-assigned',
        rotationPriority: 'high'
      }
    }));
  }

  return employees.map(employee => {
    const rotationData = analyzeEmployeeRotation(employee.id, publishedSchedules);
    return {
      ...employee,
      rotationData
    };
  });
}

/**
 * Analyze rotation data for a single employee
 * @param {string} employeeId - Employee ID
 * @param {Array} schedules - Published schedules sorted newest first
 * @returns {Object} Rotation metrics for the employee
 */
function analyzeEmployeeRotation(employeeId, schedules) {
  let lastDarAssignment = null;
  let lastNewIncomingAssignment = null;
  let lastCrossTrainingAssignment = null;
  let lastAnyAssignment = null;
  let totalDarCount = 0;
  let totalNewIncomingCount = 0;
  let totalCrossTrainingCount = 0;
  let schedulesSinceLastDar = null;
  let schedulesSinceLastNewIncoming = null;
  let schedulesSinceLastAny = null;

  // Analyze each schedule
  schedules.forEach((schedule, index) => {
    const assignment = schedule.assignments?.[employeeId];

    if (!assignment) {
      return;
    }

    // Track DAR assignments
    if (assignment.dars && Array.isArray(assignment.dars) && assignment.dars.length > 0) {
      totalDarCount += assignment.dars.length;
      if (!lastDarAssignment) {
        lastDarAssignment = {
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          entities: assignment.dars,
          entityCount: assignment.dars.length
        };
        schedulesSinceLastDar = index;
      }
    }

    // Track New Incoming assignments
    if (assignment.newIncoming && Array.isArray(assignment.newIncoming) && assignment.newIncoming.length > 0) {
      totalNewIncomingCount += assignment.newIncoming.length;
      if (!lastNewIncomingAssignment) {
        lastNewIncomingAssignment = {
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          entities: assignment.newIncoming,
          entityCount: assignment.newIncoming.length
        };
        schedulesSinceLastNewIncoming = index;
      }
    }

    // Track Cross Training assignments
    if (assignment.crossTraining && Array.isArray(assignment.crossTraining) && assignment.crossTraining.length > 0) {
      totalCrossTrainingCount += assignment.crossTraining.length;
      if (!lastCrossTrainingAssignment) {
        lastCrossTrainingAssignment = {
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          entities: assignment.crossTraining,
          entityCount: assignment.crossTraining.length
        };
      }
    }

    // Track last ANY assignment
    if (!lastAnyAssignment) {
      lastAnyAssignment = {
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        startDate: schedule.startDate,
        endDate: schedule.endDate
      };
      schedulesSinceLastAny = index;
    }
  });

  const totalAssignmentCount = totalDarCount + totalNewIncomingCount + totalCrossTrainingCount;

  // Calculate rotation score (higher = more due for rotation)
  const rotationScore = calculateRotationScore({
    schedulesSinceLastAny,
    schedulesSinceLastDar,
    schedulesSinceLastNewIncoming,
    totalAssignmentCount,
    totalSchedules: schedules.length
  });

  // Determine rotation status
  const rotationStatus = determineRotationStatus(schedulesSinceLastAny, schedules.length);
  const rotationPriority = determineRotationPriority(rotationScore, rotationStatus);

  return {
    lastDarAssignment,
    lastNewIncomingAssignment,
    lastCrossTrainingAssignment,
    lastAnyAssignment,
    totalDarCount,
    totalNewIncomingCount,
    totalCrossTrainingCount,
    totalAssignmentCount,
    schedulesSinceLastDar,
    schedulesSinceLastNewIncoming,
    schedulesSinceLastAny,
    rotationScore,
    rotationStatus,
    rotationPriority
  };
}

/**
 * Calculate rotation score (0-100, higher = more due for rotation)
 * @param {Object} params - Rotation parameters
 * @returns {number} Score from 0-100
 */
function calculateRotationScore({
  schedulesSinceLastAny,
  schedulesSinceLastDar,
  schedulesSinceLastNewIncoming,
  totalAssignmentCount,
  totalSchedules
}) {
  // Never assigned = max score
  if (schedulesSinceLastAny === null) {
    return 100;
  }

  // Factors:
  // 1. Time since last assignment (40% weight)
  // 2. Assignment frequency (30% weight)
  // 3. Balance between DAR and New Incoming (30% weight)

  // Factor 1: Time since last assignment (0-40 points)
  const timeSinceScore = Math.min((schedulesSinceLastAny / totalSchedules) * 40, 40);

  // Factor 2: Assignment frequency (0-30 points)
  // Fewer assignments = higher score
  const avgAssignmentsPerSchedule = totalAssignmentCount / totalSchedules;
  const frequencyScore = Math.max(0, 30 - (avgAssignmentsPerSchedule * 10));

  // Factor 3: Balance score (0-30 points)
  // Having both DAR and New Incoming = better balance = lower score
  // Missing one type = higher score (due for that type)
  let balanceScore = 0;
  if (schedulesSinceLastDar === null && schedulesSinceLastNewIncoming === null) {
    balanceScore = 30; // Never assigned either
  } else if (schedulesSinceLastDar === null) {
    balanceScore = 20; // Never assigned DAR
  } else if (schedulesSinceLastNewIncoming === null) {
    balanceScore = 20; // Never assigned New Incoming
  } else {
    // Both assigned - calculate imbalance
    const darRecency = schedulesSinceLastDar;
    const newIncomingRecency = schedulesSinceLastNewIncoming;
    const imbalance = Math.abs(darRecency - newIncomingRecency);
    balanceScore = Math.min(imbalance * 3, 30);
  }

  const totalScore = timeSinceScore + frequencyScore + balanceScore;
  return Math.round(Math.min(totalScore, 100));
}

/**
 * Determine rotation status based on schedules since last assignment
 * @param {number|null} schedulesSinceLastAny - Number of schedules since last assignment
 * @param {number} totalSchedules - Total number of schedules analyzed
 * @returns {string} Status: 'recent', 'due', 'overdue', or 'never-assigned'
 */
function determineRotationStatus(schedulesSinceLastAny, totalSchedules) {
  if (schedulesSinceLastAny === null) {
    return 'never-assigned';
  }

  // Recent: assigned in last 1-2 schedules
  if (schedulesSinceLastAny <= 1) {
    return 'recent';
  }

  // Due: assigned 2-4 schedules ago
  if (schedulesSinceLastAny <= 3) {
    return 'due';
  }

  // Overdue: assigned 5+ schedules ago
  return 'overdue';
}

/**
 * Determine rotation priority for scheduling
 * @param {number} rotationScore - Rotation score (0-100)
 * @param {string} rotationStatus - Rotation status
 * @returns {string} Priority: 'high', 'medium', or 'low'
 */
function determineRotationPriority(rotationScore, rotationStatus) {
  if (rotationStatus === 'never-assigned' || rotationStatus === 'overdue') {
    return 'high';
  }

  if (rotationStatus === 'due' || rotationScore >= 60) {
    return 'medium';
  }

  return 'low';
}

/**
 * Get rotation status badge configuration
 * @param {string} status - Rotation status
 * @returns {Object} Badge configuration with color and label
 */
export function getRotationStatusBadge(status) {
  const badges = {
    'never-assigned': {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-300 dark:border-red-800',
      label: 'Never Assigned',
      icon: '🔴'
    },
    'overdue': {
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-300 dark:border-orange-800',
      label: 'Overdue',
      icon: '🟠'
    },
    'due': {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800',
      label: 'Due',
      icon: '🟡'
    },
    'recent': {
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-300 dark:border-green-800',
      label: 'Recent',
      icon: '🟢'
    }
  };

  return badges[status] || badges.recent;
}

/**
 * Get rotation priority badge configuration
 * @param {string} priority - Rotation priority
 * @returns {Object} Badge configuration
 */
export function getRotationPriorityBadge(priority) {
  const badges = {
    'high': {
      color: 'bg-red-500 text-white dark:bg-red-600',
      label: 'High Priority'
    },
    'medium': {
      color: 'bg-yellow-500 text-white dark:bg-yellow-600',
      label: 'Medium Priority'
    },
    'low': {
      color: 'bg-green-500 text-white dark:bg-green-600',
      label: 'Low Priority'
    }
  };

  return badges[priority] || badges.low;
}

/**
 * Sort employees by rotation priority (most due first)
 * @param {Array} employeesWithRotation - Employees with rotation data
 * @returns {Array} Sorted employees
 */
export function sortByRotationPriority(employeesWithRotation) {
  return [...employeesWithRotation].sort((a, b) => {
    // First sort by rotation score (higher = more due)
    const scoreDiff = b.rotationData.rotationScore - a.rotationData.rotationScore;
    if (scoreDiff !== 0) return scoreDiff;

    // Then by schedules since last assignment
    const aSchedules = a.rotationData.schedulesSinceLastAny ?? 999;
    const bSchedules = b.rotationData.schedulesSinceLastAny ?? 999;
    return bSchedules - aSchedules;
  });
}

/**
 * Get employees due for a specific assignment type
 * @param {Array} employeesWithRotation - Employees with rotation data
 * @param {string} assignmentType - 'dar' or 'newIncoming'
 * @param {number} threshold - Minimum schedules since last assignment
 * @returns {Array} Filtered employees
 */
export function getEmployeesDueForAssignment(employeesWithRotation, assignmentType = 'dar', threshold = 2) {
  return employeesWithRotation.filter(emp => {
    const schedulesSince = assignmentType === 'dar'
      ? emp.rotationData.schedulesSinceLastDar
      : emp.rotationData.schedulesSinceLastNewIncoming;

    return schedulesSince === null || schedulesSince >= threshold;
  });
}

/**
 * Format date range for display
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {string} Formatted date range
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return 'No dates';
  if (!endDate) return startDate;
  return `${startDate} - ${endDate}`;
}

/**
 * Calculate days since a given date
 * @param {string} dateStr - Date string
 * @returns {number|null} Days since date, or null if invalid
 */
export function daysSince(dateStr) {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    logger.error('Error calculating days since date:', error);
    return null;
  }
}
