/**
 * Assignment statistics calculation utilities
 * Provides functions to analyze assignment patterns across schedules
 */

/**
 * Calculate CPOE assignment statistics across all schedules
 * @param {Array} schedules - All schedules
 * @param {Array} employees - All employees
 * @returns {Object} CPOE statistics
 */
export function calculateCpoeStats(schedules, employees) {
  if (!Array.isArray(schedules) || !Array.isArray(employees)) {
    return {
      totalCount: 0,
      employeeBreakdown: [],
      trend: 'stable'
    };
  }

  const employeeMap = new Map();
  const scheduleTimeline = [];

  // Analyze each schedule
  schedules.forEach(schedule => {
    if (!schedule.assignments) return;

    let scheduleCount = 0;
    Object.entries(schedule.assignments).forEach(([employeeId, assignment]) => {
      if (assignment.cpoe) {
        scheduleCount++;
        
        if (!employeeMap.has(employeeId)) {
          employeeMap.set(employeeId, {
            employeeId,
            count: 0,
            schedules: []
          });
        }

        const empData = employeeMap.get(employeeId);
        empData.count++;
        empData.schedules.push(schedule.id);
      }
    });

    // Track timeline for trend analysis
    if (schedule.startDate) {
      scheduleTimeline.push({
        date: new Date(schedule.startDate),
        count: scheduleCount
      });
    }
  });

  // Build employee breakdown with names
  const employeeBreakdown = Array.from(employeeMap.values()).map(empData => {
    const employee = employees.find(e => e.id === empData.employeeId);
    return {
      ...empData,
      employeeName: employee?.name || 'Unknown Employee'
    };
  }).sort((a, b) => b.count - a.count);

  // Calculate trend
  const trend = calculateTrend(scheduleTimeline);

  return {
    totalCount: employeeBreakdown.reduce((sum, emp) => sum + emp.count, 0),
    employeeBreakdown,
    trend
  };
}

/**
 * Calculate entity assignment statistics
 * @param {Array} schedules - All schedules
 * @param {Array} entities - All entities
 * @param {Array} employees - All employees
 * @param {string} assignmentType - 'newIncoming' or 'crossTraining'
 * @returns {Array} Entity statistics
 */
export function calculateEntityStats(schedules, entities, employees, assignmentType) {
  if (!Array.isArray(schedules) || !Array.isArray(entities) || !Array.isArray(employees)) {
    return [];
  }

  const entityMap = new Map();

  // Initialize all entities
  entities.forEach(entity => {
    entityMap.set(entity.name, {
      entityId: entity.id,
      entityName: entity.name,
      totalAssignments: 0,
      employees: new Map(),
      neverAssigned: true
    });
  });

  // Analyze assignments
  schedules.forEach(schedule => {
    if (!schedule.assignments) return;

    Object.entries(schedule.assignments).forEach(([employeeId, assignment]) => {
      const entityList = assignment[assignmentType];
      if (!entityList) return;

      const entities = Array.isArray(entityList) ? entityList : [entityList];
      
      entities.forEach(entityName => {
        if (!entityMap.has(entityName)) {
          // Entity might have been deleted, create placeholder
          entityMap.set(entityName, {
            entityId: null,
            entityName,
            totalAssignments: 0,
            employees: new Map(),
            neverAssigned: false
          });
        }

        const entityData = entityMap.get(entityName);
        entityData.totalAssignments++;
        entityData.neverAssigned = false;

        if (!entityData.employees.has(employeeId)) {
          entityData.employees.set(employeeId, {
            employeeId,
            count: 0,
            lastAssigned: null
          });
        }

        const empData = entityData.employees.get(employeeId);
        empData.count++;
        
        // Update last assigned date
        if (schedule.startDate) {
          const scheduleDate = new Date(schedule.startDate);
          if (!empData.lastAssigned || scheduleDate > new Date(empData.lastAssigned)) {
            empData.lastAssigned = schedule.startDate;
          }
        }
      });
    });
  });

  // Convert to array and add employee names
  return Array.from(entityMap.values()).map(entityData => {
    const employeeList = Array.from(entityData.employees.values()).map(empData => {
      const employee = employees.find(e => e.id === empData.employeeId);
      return {
        ...empData,
        employeeName: employee?.name || 'Unknown Employee'
      };
    }).sort((a, b) => b.count - a.count);

    return {
      ...entityData,
      employees: employeeList
    };
  }).sort((a, b) => {
    // Sort: assigned entities first (by count), then never assigned
    if (a.neverAssigned && !b.neverAssigned) return 1;
    if (!a.neverAssigned && b.neverAssigned) return -1;
    return b.totalAssignments - a.totalAssignments;
  });
}

/**
 * Calculate special projects assignment statistics
 * @param {Array} schedules - All schedules
 * @param {Array} employees - All employees
 * @returns {Object} Special projects statistics
 */
export function calculateSpecialProjectStats(schedules, employees) {
  if (!Array.isArray(schedules) || !Array.isArray(employees)) {
    return {
      threePEmail: { count: 0, employees: [] },
      threePBackupEmail: { count: 0, employees: [] },
      float: { count: 0, employees: [] },
      other: { count: 0, projects: [], employees: [] }
    };
  }

  const stats = {
    threePEmail: { employeeIds: new Set(), count: 0 },
    threePBackupEmail: { employeeIds: new Set(), count: 0 },
    float: { employeeIds: new Set(), count: 0 },
    other: { employeeIds: new Set(), projects: new Set(), count: 0 }
  };

  schedules.forEach(schedule => {
    if (!schedule.assignments) return;

    Object.entries(schedule.assignments).forEach(([employeeId, assignment]) => {
      const sp = assignment.specialProjects;
      if (!sp) return;

      // Handle new object format
      if (typeof sp === 'object' && !Array.isArray(sp)) {
        if (sp.threePEmail) {
          stats.threePEmail.employeeIds.add(employeeId);
          stats.threePEmail.count++;
        }
        if (sp.threePBackupEmail) {
          stats.threePBackupEmail.employeeIds.add(employeeId);
          stats.threePBackupEmail.count++;
        }
        if (sp.float) {
          stats.float.employeeIds.add(employeeId);
          stats.float.count++;
        }
        if (sp.other) {
          stats.other.employeeIds.add(employeeId);
          stats.other.projects.add(sp.other);
          stats.other.count++;
        }
      }
      // Handle old array/string format
      else if (Array.isArray(sp) || typeof sp === 'string') {
        const projects = Array.isArray(sp) ? sp : [sp];
        projects.forEach(project => {
          stats.other.employeeIds.add(employeeId);
          stats.other.projects.add(project);
          stats.other.count++;
        });
      }
    });
  });

  // Convert to final format with employee names
  return {
    threePEmail: {
      count: stats.threePEmail.count,
      employees: Array.from(stats.threePEmail.employeeIds).map(id => {
        const emp = employees.find(e => e.id === id);
        return emp?.name || 'Unknown';
      })
    },
    threePBackupEmail: {
      count: stats.threePBackupEmail.count,
      employees: Array.from(stats.threePBackupEmail.employeeIds).map(id => {
        const emp = employees.find(e => e.id === id);
        return emp?.name || 'Unknown';
      })
    },
    float: {
      count: stats.float.count,
      employees: Array.from(stats.float.employeeIds).map(id => {
        const emp = employees.find(e => e.id === id);
        return emp?.name || 'Unknown';
      })
    },
    other: {
      count: stats.other.count,
      projects: Array.from(stats.other.projects),
      employees: Array.from(stats.other.employeeIds).map(id => {
        const emp = employees.find(e => e.id === id);
        return emp?.name || 'Unknown';
      })
    }
  };
}

/**
 * Calculate trend from timeline data
 * @param {Array} timeline - Array of {date, count} objects
 * @returns {string} 'increasing', 'decreasing', or 'stable'
 */
function calculateTrend(timeline) {
  if (timeline.length < 2) return 'stable';

  // Sort by date
  timeline.sort((a, b) => a.date - b.date);

  // Compare first half vs second half
  const midpoint = Math.floor(timeline.length / 2);
  const firstHalf = timeline.slice(0, midpoint);
  const secondHalf = timeline.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, item) => sum + item.count, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, item) => sum + item.count, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  const threshold = 0.1; // 10% change threshold

  if (diff > threshold) return 'increasing';
  if (diff < -threshold) return 'decreasing';
  return 'stable';
}
