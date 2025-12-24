import { describe, it, expect } from 'vitest';
import { canAssignDAR, getAvailableEntitiesForDar, getAvailableEntitiesForAssignment } from '../../utils/assignmentLogic';

describe('Assignment Logic Utilities', () => {
  describe('canAssignDAR', () => {
    it('should return true for employee with DAR skill', () => {
      const employee = { id: '1', name: 'Test', skills: ['DAR'] };
      expect(canAssignDAR(employee)).toBe(true);
    });

    it('should return true for employee with Float skill', () => {
      const employee = { id: '1', name: 'Test', skills: ['Float'] };
      expect(canAssignDAR(employee)).toBe(true);
    });

    it('should return false for employee without DAR or Float skill', () => {
      const employee = { id: '1', name: 'Test', skills: ['CPOE'] };
      expect(canAssignDAR(employee)).toBe(false);
    });

    it('should return false for employee with no skills', () => {
      const employee = { id: '1', name: 'Test', skills: [] };
      expect(canAssignDAR(employee)).toBe(false);
    });

    it('should return false for null employee', () => {
      expect(canAssignDAR(null)).toBe(false);
    });
  });

  describe('getAvailableEntitiesForDar', () => {
    const entities = [
      { id: '1', name: 'Entity1' },
      { id: '2', name: 'Entity2' },
      { id: '3', name: 'Entity3' }
    ];

    it('should return all entities when no DARs assigned', () => {
      const result = getAvailableEntitiesForDar(0, {}, entities);
      expect(result).toHaveLength(3);
    });

    it('should exclude entities assigned to other DARs', () => {
      const darEntities = {
        0: ['Entity1'],
        1: ['Entity2']
      };
      const result = getAvailableEntitiesForDar(2, darEntities, entities);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Entity3');
    });

    it('should include entities assigned to same DAR', () => {
      const darEntities = {
        0: ['Entity1', 'Entity2']
      };
      const result = getAvailableEntitiesForDar(0, darEntities, entities);
      expect(result).toHaveLength(3);
    });

    it('should handle array entities', () => {
      const darEntities = {
        0: ['Entity1', 'Entity2']
      };
      const result = getAvailableEntitiesForDar(1, darEntities, entities);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Entity3');
    });
  });

  describe('getAvailableEntitiesForAssignment', () => {
    const entities = [
      { id: '1', name: 'Texas Health Allen' },
      { id: '2', name: 'Texas Health Arlington Memorial' },
      { id: '3', name: 'Other Entity' }
    ];

    it('should return all entities regardless of other assignments', () => {
      const assignments = {
        emp1: { crossTraining: ['Other Entity'] },
        emp2: { newIncoming: ['Texas Health Arlington Memorial'] }
      };
      const result = getAvailableEntitiesForAssignment('emp1', 'newIncoming', assignments, {}, entities);
      expect(result).toHaveLength(3);
      expect(result.map(e => e.name).sort()).toEqual(['Other Entity', 'Texas Health Allen', 'Texas Health Arlington Memorial']);
    });

    it('should deduplicate entities by name regardless of case/spacing', () => {
      const entitiesWithDuplicates = [
        { id: '1', name: 'Texas Health Allen' },
        { id: '2', name: ' texas health allen ' },
        { id: '3', name: 'TEXAS HEALTH ARLINGTON MEMORIAL' }
      ];
      const result = getAvailableEntitiesForAssignment('emp1', 'newIncoming', {}, {}, entitiesWithDuplicates);
      expect(result).toHaveLength(2);
      expect(result.map(e => e.name).sort()).toEqual(['TEXAS HEALTH ARLINGTON MEMORIAL', 'Texas Health Allen']);
    });

    it('should deduplicate entities that share the same short code', () => {
      // "Texas Health Allen" -> THA
      // "THA" -> THA
      // Should prefer the longer name "Texas Health Allen"
      const entitiesWithCodeCollision = [
        { id: '1', name: 'Texas Health Allen' },
        { id: '2', name: 'THA' },
        { id: '3', name: 'Other Entity' }
      ];
      const result = getAvailableEntitiesForAssignment('emp1', 'newIncoming', {}, {}, entitiesWithCodeCollision);
      expect(result).toHaveLength(2);
      expect(result.map(e => e.name).sort()).toEqual(['Other Entity', 'Texas Health Allen']);
    });

    it('should include entities assigned to same field of same employee', () => {
      const assignments = {
        emp1: { newIncoming: ['Texas Health Allen'] }
      };
      const result = getAvailableEntitiesForAssignment('emp1', 'newIncoming', assignments, {}, entities);
      expect(result).toHaveLength(3);
    });

    it('should remove legacy THR placeholder entities', () => {
      const entitiesWithThr = [
        { id: '1', name: 'THR' },
        { id: '2', name: 'Texas Health Allen' },
        { id: '3', name: 'thr' }
      ];
      const result = getAvailableEntitiesForAssignment('emp1', 'newIncoming', {}, {}, entitiesWithThr);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Texas Health Allen');
    });
  });
});
