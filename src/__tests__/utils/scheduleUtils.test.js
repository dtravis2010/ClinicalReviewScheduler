import { describe, it, expect } from 'vitest';
import { formatEntityList, formatDateRange, getEntityShortCode, getActiveEmployees } from '../../utils/scheduleUtils';

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

    it('should return empty string when start date missing', () => {
      expect(formatDateRange('', '2024-01-07')).toBe('');
    });

    it('should return empty string when end date missing', () => {
      expect(formatDateRange('2024-01-01', '')).toBe('');
    });

    it('should return empty string when both dates missing', () => {
      expect(formatDateRange('', '')).toBe('');
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
});
