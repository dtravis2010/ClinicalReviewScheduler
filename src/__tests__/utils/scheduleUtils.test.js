import { describe, it, expect } from 'vitest';
import { formatEntityList, formatDateRange, getEntityShortCode, getActiveEmployees, hasSpecialProjects } from '../../utils/scheduleUtils';

describe('Schedule Utilities', () => {
  describe('formatEntityList', () => {
    it('should format array of entities with /', () => {
      expect(formatEntityList(['Entity1', 'Entity2', 'Entity3'])).toBe('Entity1/Entity2/Entity3');
    });

    it('should return single entity as-is', () => {
      expect(formatEntityList('Entity1')).toBe('Entity1');
    });

    it('should return empty string for null', () => {
      expect(formatEntityList(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatEntityList(undefined)).toBe('');
    });

    it('should handle empty array', () => {
      expect(formatEntityList([])).toBe('');
    });
  });

  describe('formatDateRange', () => {
    it('should format date range correctly', () => {
      expect(formatDateRange('2024-01-01', '2024-01-07')).toBe('2024-01-01 to 2024-01-07');
    });

    it('should format date range with month and year only when monthYearOnly is true', () => {
      expect(formatDateRange('2025-03-01', '2025-09-30', true)).toBe('March 2025 - September 2025');
    });

    it('should format date range with month and year for different years', () => {
      expect(formatDateRange('2024-12-01', '2025-02-28', true)).toBe('December 2024 - February 2025');
    });

    it('should format date range with month and year for same month', () => {
      expect(formatDateRange('2025-01-01', '2025-01-31', true)).toBe('January 2025 - January 2025');
    });

    it('should return empty string when start date missing', () => {
      expect(formatDateRange('', '2024-01-07')).toBe('');
    });

    it('should return empty string when end date missing', () => {
      expect(formatDateRange('2024-01-01', '')).toBe('');
    });

    it('should return empty string when both dates missing', () => {
      expect(formatDateRange('', '')).toBe('');
    });

    it('should return empty string when monthYearOnly is true but dates are missing', () => {
      expect(formatDateRange('', '', true)).toBe('');
    });
  });

  describe('getEntityShortCode', () => {
    it('should extract abbreviation from entity name with capitals', () => {
      expect(getEntityShortCode('Texas Health Allen')).toBe('THA');
    });

    it('should extract abbreviation for each entity in array', () => {
      expect(getEntityShortCode(['Texas Health Allen', 'Medical City Dallas'])).toBe('THA/MCD');
    });

    it('should handle entity names with / separator', () => {
      expect(getEntityShortCode('Texas Health Allen/Details')).toBe('THA');
    });
    
    it('should handle single word entities', () => {
      expect(getEntityShortCode('Entity')).toBe('E');
    });
    
    it('should handle lowercase entity names', () => {
      expect(getEntityShortCode('texas health allen')).toBe('THA');
    });

    it('should return empty string for null', () => {
      expect(getEntityShortCode(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(getEntityShortCode(undefined)).toBe('');
    });

    it('should handle empty array', () => {
      expect(getEntityShortCode([])).toBe('');
    });
  });

  describe('getActiveEmployees', () => {
    it('should filter out archived employees', () => {
      const employees = [
        { id: '1', name: 'Alice', archived: false },
        { id: '2', name: 'Bob', archived: true },
        { id: '3', name: 'Charlie', archived: false }
      ];
      const result = getActiveEmployees(employees);
      expect(result).toHaveLength(2);
      expect(result.find(e => e.name === 'Bob')).toBeUndefined();
    });

    it('should deduplicate by name (case-insensitive)', () => {
      const employees = [
        { id: '1', name: 'Alice', archived: false, createdAt: { toDate: () => new Date('2024-01-01') } },
        { id: '2', name: 'alice', archived: false, createdAt: { toDate: () => new Date('2024-01-02') } }
      ];
      const result = getActiveEmployees(employees);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2'); // Should keep more recent
    });

    it('should keep most recent version based on updatedAt', () => {
      const employees = [
        { id: '1', name: 'Alice', archived: false, updatedAt: { toDate: () => new Date('2024-01-01') } },
        { id: '2', name: 'Alice', archived: false, updatedAt: { toDate: () => new Date('2024-01-02') } }
      ];
      const result = getActiveEmployees(employees);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should sort by name', () => {
      const employees = [
        { id: '1', name: 'Charlie', archived: false },
        { id: '2', name: 'Alice', archived: false },
        { id: '3', name: 'Bob', archived: false }
      ];
      const result = getActiveEmployees(employees);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should handle empty array', () => {
      expect(getActiveEmployees([])).toEqual([]);
    });

    it('should handle null', () => {
      expect(getActiveEmployees(null)).toEqual([]);
    });

    it('should filter out employees with no name', () => {
      const employees = [
        { id: '1', name: 'Alice', archived: false },
        { id: '2', name: '', archived: false },
        { id: '3', name: null, archived: false }
      ];
      const result = getActiveEmployees(employees);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('hasSpecialProjects', () => {
    it('should return true for object with threePEmail set to true', () => {
      expect(hasSpecialProjects({ threePEmail: true, threePBackupEmail: false, float: false, other: '' })).toBe(true);
    });

    it('should return true for object with threePBackupEmail set to true', () => {
      expect(hasSpecialProjects({ threePEmail: false, threePBackupEmail: true, float: false, other: '' })).toBe(true);
    });

    it('should return true for object with float set to true', () => {
      expect(hasSpecialProjects({ threePEmail: false, threePBackupEmail: false, float: true, other: '' })).toBe(true);
    });

    it('should return true for object with other field containing text', () => {
      expect(hasSpecialProjects({ threePEmail: false, threePBackupEmail: false, float: false, other: 'Custom project' })).toBe(true);
    });

    it('should return false for object with all fields false or empty', () => {
      expect(hasSpecialProjects({ threePEmail: false, threePBackupEmail: false, float: false, other: '' })).toBe(false);
    });

    it('should return false for object with other field containing only whitespace', () => {
      expect(hasSpecialProjects({ threePEmail: false, threePBackupEmail: false, float: false, other: '   ' })).toBe(false);
    });

    it('should return true for array with items', () => {
      expect(hasSpecialProjects(['Project1', 'Project2'])).toBe(true);
    });

    it('should return false for empty array', () => {
      expect(hasSpecialProjects([])).toBe(false);
    });

    it('should return true for non-empty string', () => {
      expect(hasSpecialProjects('Special Project')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(hasSpecialProjects('')).toBe(false);
    });

    it('should return false for string with only whitespace', () => {
      expect(hasSpecialProjects('   ')).toBe(false);
    });

    it('should return false for null', () => {
      expect(hasSpecialProjects(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasSpecialProjects(undefined)).toBe(false);
    });

    it('should return true for object with multiple fields set', () => {
      expect(hasSpecialProjects({ threePEmail: true, threePBackupEmail: true, float: false, other: 'Test' })).toBe(true);
    });

    it('should return false for object with other field containing non-string value', () => {
      expect(hasSpecialProjects({ threePEmail: false, threePBackupEmail: false, float: false, other: 123 })).toBe(false);
    });

    it('should return false for object with other field containing null', () => {
      expect(hasSpecialProjects({ threePEmail: false, threePBackupEmail: false, float: false, other: null })).toBe(false);
    });
  });
});
