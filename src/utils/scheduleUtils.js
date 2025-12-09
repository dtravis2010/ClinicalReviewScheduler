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
 * @param {string} startDate - Start date (YYYY-MM-DD format)
 * @param {string} endDate - End date (YYYY-MM-DD format)
 * @param {boolean} monthYearOnly - If true, show only month and year (e.g., "Jan 2026 - Feb 2026")
 * @returns {string} Formatted date range
 */
export function formatDateRange(startDate, endDate, monthYearOnly = false) {
  if (!startDate || !endDate) return '';
  
  if (monthYearOnly) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const startMonth = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const endMonth = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      return `${startMonth} - ${endMonth}`;
    } catch (error) {
      // Fallback to original format if date parsing fails
      return `${startDate} to ${endDate}`;
    }
  }
  
  return `${startDate} to ${endDate}`;
}

/**
 * Get short entity code for display in cells
 * Extracts abbreviation from entity name (e.g., "Texas Health Allen" -> "THA")
 * @param {Array|string} entityList - Entity or list of entities
 * @returns {string} Short entity code
 */
export function getEntityShortCode(entityList) {
  if (!entityList) return '';
  
  // Helper function to extract abbreviation from a single entity name
  const getAbbreviation = (entityName) => {
    if (!entityName) return '';
    
    // Split by '/' first (in case entity name contains it)
    const parts = entityName.split('/');
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
