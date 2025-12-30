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
 * Handles three display modes:
 * - Same month: "January 2026"
 * - Multi-month same year: "Jan–Feb 2026"
 * - Year boundary: "Dec 2025–Jan 2026"
 *
 * @param {string} startDate - Start date (YYYY-MM-DD format)
 * @param {string} endDate - End date (YYYY-MM-DD format)
 * @param {boolean} monthYearOnly - If true, show only month and year format
 * @returns {string} Formatted date range
 */
export function formatDateRange(startDate, endDate, monthYearOnly = false) {
  if (!startDate || !endDate) return '';

  if (monthYearOnly) {
    try {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');

      const startMonth = start.getMonth();
      const endMonth = end.getMonth();
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();

      // Same month and year: "January 2026"
      if (startMonth === endMonth && startYear === endYear) {
        return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }

      // Same year, different months: "Jan–Feb 2026"
      if (startYear === endYear) {
        const startMonthShort = start.toLocaleDateString('en-US', { month: 'short' });
        const endMonthShort = end.toLocaleDateString('en-US', { month: 'short' });
        return `${startMonthShort}–${endMonthShort} ${startYear}`;
      }

      // Different years: "Dec 2025–Jan 2026"
      const startFormatted = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const endFormatted = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `${startFormatted}–${endFormatted}`;
    } catch (error) {
      // Fallback to original format if date parsing fails
      return `${startDate} to ${endDate}`;
    }
  }

  return `${startDate} to ${endDate}`;
}

/**
 * Get short entity code for display in cells
 * Uses custom entity code if available, otherwise extracts abbreviation from name
 * @param {Array|string|Object} entityList - Entity, list of entities, or entity object(s)
 * @param {Array} [allEntities] - Full list of entities with code fields (optional)
 * @returns {string} Short entity code
 */
export function getEntityShortCode(entityList, allEntities = []) {
  if (!entityList) return '';

  // Skip if it's an object (like new specialProjects format) that's not an entity
  if (typeof entityList === 'object' && !Array.isArray(entityList) && !entityList.name) {
    return '';
  }

  // Helper function to extract abbreviation from a single entity name or object
  const getAbbreviation = (entity) => {
    // Handle object with name and optional code
    if (typeof entity === 'object' && entity !== null && entity.name) {
      // Use custom code if available
      if (entity.code && entity.code.trim()) {
        return entity.code.trim().toUpperCase();
      }
      entity = entity.name;
    }

    if (!entity || typeof entity !== 'string') return '';

    // Try to find entity in allEntities list by name to get custom code
    if (allEntities && allEntities.length > 0) {
      const foundEntity = allEntities.find(e => e.name === entity);
      if (foundEntity && foundEntity.code && foundEntity.code.trim()) {
        return foundEntity.code.trim().toUpperCase();
      }
    }

    // Split by '/' first (in case entity name contains it)
    const parts = entity.split('/');
    const mainPart = parts[0].trim();

    // Extract capital letters to form abbreviation
    // e.g., "Texas Health Allen" -> "THA"
    const capitals = mainPart.match(/[A-Z]/g);
    if (capitals && capitals.length > 0) {
      return capitals.join('');
    }

    // Fallback: take first letter of each word
    const words = mainPart.split(/\s+/);
    return words.map(word => word.charAt(0).toUpperCase()).join('');
  };

  if (Array.isArray(entityList)) {
    return entityList.map(e => getAbbreviation(e)).join('/');
  }

  return getAbbreviation(entityList);
}

/**
 * Check if specialProjects has any value
 * Handles object format { threePEmail, threePBackupEmail, float, other },
 * array format, and string format
 * @param {Object|Array|string} specialProjects - Special projects data
 * @returns {boolean} True if there are any special projects assigned
 */
export function hasSpecialProjects(specialProjects) {
  if (!specialProjects) return false;
  
  // Handle object format (new format)
  if (typeof specialProjects === 'object' && !Array.isArray(specialProjects)) {
    // Check if any boolean field is true or if 'other' has a value
    return !!(
      specialProjects.threePEmail || 
      specialProjects.threePBackupEmail || 
      specialProjects.float || 
      (specialProjects.other && typeof specialProjects.other === 'string' && specialProjects.other.trim())
    );
  }
  
  // Handle array format (backward compatibility)
  if (Array.isArray(specialProjects)) {
    return specialProjects.length > 0;
  }
  
  // Handle string format (backward compatibility)
  if (typeof specialProjects === 'string') {
    return specialProjects.trim().length > 0;
  }
  
  return false;
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

/**
 * Get employee initials from name
 * @param {string} employeeName - Employee's full name
 * @returns {string} Employee initials (e.g., "John Doe" -> "JD")
 */
export function getEmployeeInitials(employeeName) {
  if (!employeeName || typeof employeeName !== 'string') return '';
  
  const words = employeeName.trim().split(/\s+/).filter(word => word.length > 0);
  return words.map(word => word.charAt(0).toUpperCase()).join('');
}
