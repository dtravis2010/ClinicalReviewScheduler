import { getEntityShortCode } from './scheduleUtils.js';

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
  const BLOCKED_NAMES = new Set(['thr']); // Remove legacy THR placeholder

  // Pre-process to find the "best" entity for each short code to avoid visual duplicates
  // Preference: Name that is NOT the short code (e.g. "Texas Health Allen" > "THA")
  // If both are full names or both are codes, pick the first one (or longest).
  const bestEntitiesByShortCode = new Map();

  entities.forEach(entity => {
    const name = entity?.name?.trim();
    if (!name) return;

    const normalized = name.toLowerCase();
    if (BLOCKED_NAMES.has(normalized)) return;

    const shortCode = getEntityShortCode([name]);

    if (!bestEntitiesByShortCode.has(shortCode)) {
      bestEntitiesByShortCode.set(shortCode, entity);
    } else {
      const existing = bestEntitiesByShortCode.get(shortCode);
      // If the new one is "better", replace it.
      // "Better" = longer name (heuristic for "Full Name" vs "Abbreviation")
      if (name.length > existing.name.length) {
        bestEntitiesByShortCode.set(shortCode, entity);
      }
    }
  });

  return Array.from(bestEntitiesByShortCode.values())
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
}
