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
 * Excludes entities already assigned to other employees
 * Note: Does NOT exclude entities assigned to DARs to allow all entities to be available
 * @param {string} employeeId - ID of the employee
 * @param {string} field - Field being assigned ('newIncoming' or 'crossTraining')
 * @param {Object} assignments - All employee assignments
 * @param {Object} darEntities - DAR column entity assignments (not used for filtering)
 * @param {Array} entities - All available entities
 * @returns {Array} Available entities for this assignment
 */
export function getAvailableEntitiesForAssignment(employeeId, field, assignments, darEntities, entities) {
  if (!Array.isArray(entities)) return [];

  // Show the full entity catalog in the dropdown so supervisors can assign any location,
  // even if it is already used elsewhere in the schedule.
  const seen = new Set();
  return entities
    .filter((entity) => {
      const key = entity?.id || entity?.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}
