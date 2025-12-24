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
      { id: '1', name: 'Entity1' },
      { id: '2', name: 'Entity2' },
      { id: '3', name: 'Entity3' }
    ];

    it('should return all entities regardless of other assignments', () => {
      const assignments = {
        emp1: { crossTraining: ['Entity3'] },
        emp2: { newIncoming: ['Entity2'] }
      };
      const result = getAvailableEntitiesForAssignment('emp1', 'newIncoming', assignments, {}, entities);
      expect(result).toHaveLength(3);
      expect(result.map(e => e.name).sort()).toEqual(['Entity1', 'Entity2', 'Entity3']);
    });

    it('should deduplicate entities by name regardless of case/spacing', () => {
      const entitiesWithDuplicates = [
        { id: '1', name: 'Entity1' },
        { id: '2', name: ' entity1 ' },
        { id: '3', name: 'ENTITY2' }
      ];
      const result = getAvailableEntitiesForAssignment('emp1', 'newIncoming', {}, {}, entitiesWithDuplicates);
      expect(result).toHaveLength(2);
      expect(result.map(e => e.name).sort()).toEqual(['ENTITY2', 'Entity1']);
    });

    it('should include entities assigned to same field of same employee', () => {
      const assignments = {
        emp1: { newIncoming: ['Entity1'] }
      };
      const result = getAvailableEntitiesForAssignment('emp1', 'newIncoming', assignments, {}, entities);
      expect(result).toHaveLength(3);
    });

    it('should remove legacy THR placeholder entities', () => {
      const entitiesWithThr = [
        { id: '1', name: 'THR' },
        { id: '2', name: 'Entity1' },
        { id: '3', name: 'thr' }
      ];
      const result = getAvailableEntitiesForAssignment('emp1', 'newIncoming', {}, {}, entitiesWithThr);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Entity1');
    });
  });
});
