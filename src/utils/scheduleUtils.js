/**
 * Schedule utility functions
 * Contains formatting and display logic for schedules
 */

/**
 * Format entity list for display
 * @param {Array|string} entityList - Entity or list of entities
 * @returns {string} Formatted entity string
 */
export function formatEntityList(entityList) {
  if (Array.isArray(entityList)) {
    return entityList.join('/');
  }
  return entityList || '';
}

/**
 * Format date range for display
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {string} Formatted date range
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '';
  return `${startDate} to ${endDate}`;
}

/**
 * Get short entity code for display in cells
 * Extracts first part before '/' for compact display
 * @param {Array|string} entityList - Entity or list of entities
 * @returns {string} Short entity code
 */
export function getEntityShortCode(entityList) {
  if (!entityList) return '';
  
  if (Array.isArray(entityList)) {
    return entityList.map(e => {
      const parts = e.split('/');
      return parts[0];
    }).join('/');
  }
  
  const parts = entityList.split('/');
  return parts[0];
}

/**
 * Filter and deduplicate employees
 * Removes archived employees and keeps most recent version of duplicates
 * @param {Array} employees - List of employees
 * @returns {Array} Filtered and deduplicated employees
 */
export function getActiveEmployees(employees) {
  if (!Array.isArray(employees)) return [];
  
  const filtered = employees.filter(e => !e.archived);
  const seen = new Map();

  // Group by normalized name (case-insensitive, trimmed)
  filtered.forEach(emp => {
    const normalizedName = emp.name?.trim().toLowerCase();
    if (!normalizedName) return;

    const existing = seen.get(normalizedName);
    if (!existing) {
      seen.set(normalizedName, emp);
    } else {
      // Keep the one with most recent updatedAt or createdAt
      const existingDate = existing.updatedAt?.toDate?.() || existing.createdAt?.toDate?.() || new Date(0);
      const currentDate = emp.updatedAt?.toDate?.() || emp.createdAt?.toDate?.() || new Date(0);
      if (currentDate > existingDate) {
        seen.set(normalizedName, emp);
      }
    }
  });

  // Return deduplicated list sorted by name
  return Array.from(seen.values()).sort((a, b) =>
    (a.name || '').localeCompare(b.name || '')
  );
}
