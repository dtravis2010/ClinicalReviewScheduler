/**
 * Entity History Utilities
 * 
 * Functions for analyzing historical entity assignments to help with scheduling decisions
 */

/**
 * Get the last employee assigned to each entity
 * @param {Array} schedules - Array of schedule objects
 * @param {Array} employees - Array of employee objects
 * @param {Array} entities - Array of entity objects
 * @returns {Object} Map of entity names to last assignment info
 */
export function getLastEntityAssignments(schedules, employees, entities) {
  const entityLastAssigned = {};

  // Initialize all entities
  entities.forEach(entity => {
    entityLastAssigned[entity.name] = {
      employeeName: null,
      employeeId: null,
      scheduleName: null,
      startDate: null,
      assignmentType: null // 'newIncoming', 'crossTraining', or 'entity'
    };
  });

  // Sort schedules by start date (most recent first)
  const sortedSchedules = [...schedules]
    .filter(s => s.status === 'published' && s.startDate)
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  // Find the most recent assignment for each entity
  sortedSchedules.forEach(schedule => {
    const assignments = schedule.assignments || {};

    Object.entries(assignments).forEach(([empId, assignment]) => {
      const employee = employees.find(e => e.id === empId);
      if (!employee) return;

      // Check newIncoming assignments
      if (Array.isArray(assignment.newIncoming)) {
        assignment.newIncoming.forEach(entityName => {
          if (entityLastAssigned[entityName] && !entityLastAssigned[entityName].employeeName) {
            entityLastAssigned[entityName] = {
              employeeName: employee.name,
              employeeId: empId,
              scheduleName: schedule.name,
              startDate: schedule.startDate,
              assignmentType: 'newIncoming'
            };
          }
        });
      }

      // Check crossTraining assignments
      if (Array.isArray(assignment.crossTraining)) {
        assignment.crossTraining.forEach(entityName => {
          if (entityLastAssigned[entityName] && !entityLastAssigned[entityName].employeeName) {
            entityLastAssigned[entityName] = {
              employeeName: employee.name,
              employeeId: empId,
              scheduleName: schedule.name,
              startDate: schedule.startDate,
              assignmentType: 'crossTraining'
            };
          }
        });
      }

      // Check legacy entity field (backward compatibility)
      if (assignment.entity && entityLastAssigned[assignment.entity] && !entityLastAssigned[assignment.entity].employeeName) {
        entityLastAssigned[assignment.entity] = {
          employeeName: employee.name,
          employeeId: empId,
          scheduleName: schedule.name,
          startDate: schedule.startDate,
          assignmentType: 'entity'
        };
      }
    });
  });

  return entityLastAssigned;
}

/**
 * Get assignment frequency for each entity
 * @param {Array} schedules - Array of schedule objects
 * @param {Array} employees - Array of employee objects
 * @param {Array} entities - Array of entity objects
 * @returns {Object} Map of entity names to assignment frequency data
 */
export function getEntityAssignmentFrequency(schedules, employees, entities) {
  const entityFrequency = {};

  // Initialize all entities
  entities.forEach(entity => {
    entityFrequency[entity.name] = {
      totalAssignments: 0,
      employeeAssignments: {} // Map of employeeId to count
    };
  });

  // Count assignments across all published schedules
  schedules
    .filter(s => s.status === 'published')
    .forEach(schedule => {
      const assignments = schedule.assignments || {};

      Object.entries(assignments).forEach(([empId, assignment]) => {
        const employee = employees.find(e => e.id === empId);
        if (!employee) return;

        // Count newIncoming assignments
        if (Array.isArray(assignment.newIncoming)) {
          assignment.newIncoming.forEach(entityName => {
            if (entityFrequency[entityName]) {
              entityFrequency[entityName].totalAssignments++;
              entityFrequency[entityName].employeeAssignments[empId] = 
                (entityFrequency[entityName].employeeAssignments[empId] || 0) + 1;
            }
          });
        }

        // Count crossTraining assignments
        if (Array.isArray(assignment.crossTraining)) {
          assignment.crossTraining.forEach(entityName => {
            if (entityFrequency[entityName]) {
              entityFrequency[entityName].totalAssignments++;
              entityFrequency[entityName].employeeAssignments[empId] = 
                (entityFrequency[entityName].employeeAssignments[empId] || 0) + 1;
            }
          });
        }

        // Count legacy entity field
        if (assignment.entity && entityFrequency[assignment.entity]) {
          entityFrequency[assignment.entity].totalAssignments++;
          entityFrequency[assignment.entity].employeeAssignments[empId] = 
            (entityFrequency[assignment.entity].employeeAssignments[empId] || 0) + 1;
        }
      });
    });

  return entityFrequency;
}

/**
 * Format date for display
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
export function formatHistoryDate(dateStr) {
  if (!dateStr) return 'Unknown';
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  } catch (error) {
    return dateStr;
  }
}
