/**
 * Assignment logic utilities for schedule management
 * Contains business logic for determining valid assignments
 */

/**
 * Check if an employee can be assigned to DAR
 * @param {Object} employee - Employee object with skills
 * @returns {boolean} True if employee has DAR or Float skill
 */
export function canAssignDAR(employee) {
  if (!employee || !employee.skills) return false;
  return employee.skills.includes('DAR') || employee.skills.includes('Float');
}

/**
 * Get available entities for a specific DAR column
 * Excludes entities already assigned to other DAR columns
 * @param {number} darIndex - Index of the DAR column
 * @param {Object} darEntities - DAR column entity assignments
 * @param {Array} entities - All available entities
 * @returns {Array} Available entities for this DAR column
 */
export function getAvailableEntitiesForDar(darIndex, darEntities, entities) {
  const assignedToDars = new Set();
  
  if (darEntities && typeof darEntities === 'object') {
    Object.entries(darEntities).forEach(([idx, entityList]) => {
      if (parseInt(idx) !== darIndex) {
        if (Array.isArray(entityList)) {
          entityList.forEach(e => assignedToDars.add(e));
        } else if (entityList) {
          assignedToDars.add(entityList);
        }
      }
    });
  }
  
  return Array.isArray(entities) ? entities.filter(e => !assignedToDars.has(e.name)) : [];
}

/**
 * Get available entities for employee assignment (newIncoming, crossTraining)
 * Excludes entities already assigned to DARs or to other employees
 * @param {string} employeeId - ID of the employee
 * @param {string} field - Field being assigned ('newIncoming' or 'crossTraining')
 * @param {Object} assignments - All employee assignments
 * @param {Object} darEntities - DAR column entity assignments
 * @param {Array} entities - All available entities
 * @returns {Array} Available entities for this assignment
 */
export function getAvailableEntitiesForAssignment(employeeId, field, assignments, darEntities, entities) {
  const assignedEntities = new Set();
  
  // Add entities assigned to DARs
  if (darEntities && typeof darEntities === 'object') {
    Object.values(darEntities).forEach(entityList => {
      if (Array.isArray(entityList)) {
        entityList.forEach(e => assignedEntities.add(e));
      } else if (entityList) {
        assignedEntities.add(entityList);
      }
    });
  }

  // Add entities assigned to other employees or other fields of same employee
  if (assignments && typeof assignments === 'object') {
    Object.entries(assignments).forEach(([empId, assignment]) => {
      if (empId !== employeeId) {
        // For other employees, exclude all their assignments
        ['newIncoming', 'crossTraining'].forEach(f => {
          if (assignment[f]) {
            if (Array.isArray(assignment[f])) {
              assignment[f].forEach(e => assignedEntities.add(e));
            } else {
              assignedEntities.add(assignment[f]);
            }
          }
        });
      } else {
        // For same employee, exclude assignments in other fields
        ['newIncoming', 'crossTraining'].forEach(f => {
          if (f !== field && assignment[f]) {
            if (Array.isArray(assignment[f])) {
              assignment[f].forEach(e => assignedEntities.add(e));
            } else {
              assignedEntities.add(assignment[f]);
            }
          }
        });
      }
    });
  }

  return Array.isArray(entities) ? entities.filter(e => !assignedEntities.has(e.name)) : [];
}
