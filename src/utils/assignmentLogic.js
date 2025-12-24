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

  // Pre-process to find the "best" entity using TWO deduplication strategies:
  // 1. Normalized name (case-insensitive) - deduplicates "Entity A" with "ENTITY A"
  // 2. Short code - deduplicates "Texas Health Allen" with "THA"
  // Preference: Keep the "best" version - longer name (e.g. "Texas Health Allen" > "THA")
  
  // Track which entities we've already added (by their id)
  const addedEntityIds = new Set();
  // Maps: key -> best entity for that key
  const byNormalizedName = new Map();
  const byShortCode = new Map();

  entities.forEach(entity => {
    const name = entity?.name?.trim();
    if (!name) return;

    const normalizedName = name.toLowerCase().replace(/\s+/g, ' ');
    if (BLOCKED_NAMES.has(normalizedName)) return;

    const shortCode = getEntityShortCode([name]);

    // Check if this entity matches an existing one by normalized name
    if (byNormalizedName.has(normalizedName)) {
      const existing = byNormalizedName.get(normalizedName);
      // Keep the longer name
      if (name.length > existing.name.length) {
        addedEntityIds.delete(existing.id);
        byNormalizedName.set(normalizedName, entity);
        addedEntityIds.add(entity.id);
      }
      return;
    }

    // Check if this entity matches an existing one by short code
    if (shortCode && byShortCode.has(shortCode)) {
      const existing = byShortCode.get(shortCode);
      // Keep the longer name
      if (name.length > existing.name.length) {
        addedEntityIds.delete(existing.id);
        byShortCode.set(shortCode, entity);
        byNormalizedName.set(normalizedName, entity);
        addedEntityIds.add(entity.id);
      }
      return;
    }

    // New entity - add to both maps
    byNormalizedName.set(normalizedName, entity);
    if (shortCode) {
      byShortCode.set(shortCode, entity);
    }
    addedEntityIds.add(entity.id);
  });

  // Collect unique entities
  const uniqueEntities = entities.filter(e => addedEntityIds.has(e.id));

  return uniqueEntities
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
}
