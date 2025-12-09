import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { detectConflicts, calculateWorkload, detectWorkloadImbalances } from '../../utils/conflictDetection';

describe('Conflict Detection', () => {
  describe('Property Tests', () => {
    /**
     * Feature: scheduler-improvements, Property 1: Skill-based assignment validity
     * Validates: Requirements 2.1
     */
    it('Property 1: employees without DAR skill assigned to DAR generate conflicts', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 1, maxLength: 3 }),
          (darIndices) => {
            const employee = {
              id: 'emp1',
              name: 'Test Employee',
              skills: ['CPOE'] // No DAR or Float skill
            };

            const assignments = {
              emp1: {
                dars: darIndices
              }
            };

            const result = detectConflicts(assignments, [employee], {});

            // Should have conflicts for each DAR assignment
            const darConflicts = result.conflicts.filter(c => c.type === 'skill_mismatch' && c.field === 'dars');
            return darConflicts.length === darIndices.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 2: Multiple entity warning generation
     * Validates: Requirements 2.2, 7.1
     */
    it('Property 2: employees with multiple entity assignments generate warnings', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
          (entities) => {
            const employee = {
              id: 'emp1',
              name: 'Test Employee',
              skills: ['DAR']
            };

            const assignments = {
              emp1: {
                newIncoming: [entities[0]],
                crossTraining: entities.slice(1)
              }
            };

            const result = detectConflicts(assignments, [employee], {});

            // Should have warning for multiple entities
            const multiEntityWarnings = result.warnings.filter(w => w.type === 'multiple_entities');
            return multiEntityWarnings.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 3: Multiple DAR column warning generation
     * Validates: Requirements 2.3, 7.2
     */
    it('Property 3: employees assigned to multiple DARs generate warnings', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 7 }), { minLength: 2, maxLength: 5 }).map(arr => [...new Set(arr)]),
          (darIndices) => {
            fc.pre(darIndices.length >= 2); // Ensure at least 2 unique DAR indices

            const employee = {
              id: 'emp1',
              name: 'Test Employee',
              skills: ['DAR']
            };

            const assignments = {
              emp1: {
                dars: darIndices
              }
            };

            const result = detectConflicts(assignments, [employee], {});

            // Should have warning for multiple DARs
            const multiDarWarnings = result.warnings.filter(w => w.type === 'multiple_dars');
            return multiDarWarnings.length > 0 && multiDarWarnings[0].count === darIndices.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 4: Schedule validation execution
     * Validates: Requirements 2.4
     */
    it('Property 4: detectConflicts always returns valid structure', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.string(),
            fc.record({
              dars: fc.option(fc.array(fc.integer({ min: 0, max: 7 }))),
              cpoe: fc.option(fc.boolean())
            })
          ),
          fc.array(fc.record({
            id: fc.string(),
            name: fc.string(),
            skills: fc.option(fc.array(fc.constantFrom('DAR', 'CPOE', 'Float', 'Trace')))
          })),
          (assignments, employees) => {
            const result = detectConflicts(assignments, employees, {});

            // Should always return valid structure
            return (
              Array.isArray(result.conflicts) &&
              Array.isArray(result.warnings) &&
              typeof result.hasIssues === 'boolean'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 5: Validation error message specificity
     * Validates: Requirements 2.5
     */
    it('Property 5: all conflicts have specific error messages', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 1, maxLength: 3 }),
          (darIndices) => {
            const employee = {
              id: 'emp1',
              name: 'Test Employee',
              skills: [] // No skills
            };

            const assignments = {
              emp1: {
                dars: darIndices,
                cpoe: true
              }
            };

            const result = detectConflicts(assignments, [employee], {});

            // All conflicts should have messages
            return result.conflicts.every(c => 
              typeof c.message === 'string' && 
              c.message.length > 0 &&
              c.message.includes(employee.name)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 25: Conflict count accuracy
     * Validates: Requirements 7.4
     */
    it('Property 25: conflict count matches actual conflicts', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 0, maxLength: 5 }),
          fc.boolean(),
          (darIndices, cpoe) => {
            const employee = {
              id: 'emp1',
              name: 'Test Employee',
              skills: [] // No skills - will cause conflicts
            };

            const assignments = {
              emp1: {
                dars: darIndices,
                cpoe: cpoe
              }
            };

            const result = detectConflicts(assignments, [employee], {});

            // Count expected conflicts
            let expectedConflicts = darIndices.length; // One per DAR
            if (cpoe) expectedConflicts += 1; // One for CPOE

            return result.conflicts.length === expectedConflicts;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 29: Workload calculation consistency
     * Validates: Requirements 13.1, 13.2
     */
    it('Property 29: workload calculation is consistent and deterministic', () => {
      fc.assert(
        fc.property(
          fc.record({
            dars: fc.option(fc.array(fc.integer({ min: 0, max: 7 }))),
            cpoe: fc.option(fc.boolean()),
            newIncoming: fc.option(fc.array(fc.string())),
            crossTraining: fc.option(fc.array(fc.string())),
            specialProjects: fc.option(fc.string())
          }),
          (assignment) => {
            const workload1 = calculateWorkload(assignment, {});
            const workload2 = calculateWorkload(assignment, {});

            // Should be deterministic
            return workload1 === workload2 && workload1 >= 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: scheduler-improvements, Property 30: Workload imbalance detection
     * Validates: Requirements 13.2
     */
    it('Property 30: workload imbalances are detected correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 20, max: 40 }),
          (lowWorkload, highWorkload) => {
            fc.pre(highWorkload / lowWorkload >= 3); // Ensure significant difference

            const employees = [
              { id: 'emp1', name: 'Low Load', archived: false },
              { id: 'emp2', name: 'High Load', archived: false }
            ];

            // Create assignments with very different workloads
            const assignments = {
              emp1: { dars: Array(Math.floor(lowWorkload / 3)).fill(0).map((_, i) => i) },
              emp2: { dars: Array(Math.floor(highWorkload / 3)).fill(0).map((_, i) => i) }
            };

            const result = detectWorkloadImbalances(assignments, employees, {});

            // Should detect imbalance when workloads are very different
            // With such a large difference, at least one should be flagged
            return result.imbalances.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should detect skill mismatch for DAR assignment', () => {
      const employee = {
        id: 'emp1',
        name: 'Test Employee',
        skills: ['CPOE']
      };

      const assignments = {
        emp1: { dars: [0, 1] }
      };

      const result = detectConflicts(assignments, [employee], {});

      expect(result.conflicts).toHaveLength(2);
      expect(result.conflicts[0].type).toBe('skill_mismatch');
      expect(result.conflicts[0].field).toBe('dars');
    });

    it('should detect skill mismatch for CPOE assignment', () => {
      const employee = {
        id: 'emp1',
        name: 'Test Employee',
        skills: ['DAR']
      };

      const assignments = {
        emp1: { cpoe: true }
      };

      const result = detectConflicts(assignments, [employee], {});

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('skill_mismatch');
      expect(result.conflicts[0].field).toBe('cpoe');
    });

    it('should calculate workload correctly', () => {
      const assignment = {
        dars: [0, 1], // 6 points
        cpoe: true, // 2 points
        newIncoming: ['Entity1'], // 2 points
        crossTraining: ['Entity2', 'Entity3'], // 2 points
        specialProjects: 'Project' // 1 point
      };

      const workload = calculateWorkload(assignment, {});
      expect(workload).toBe(13);
    });

    it('should calculate workload with specialProjects object format', () => {
      const assignment = {
        dars: [0, 1], // 6 points
        cpoe: true, // 2 points
        newIncoming: ['Entity1'], // 2 points
        crossTraining: ['Entity2', 'Entity3'], // 2 points
        specialProjects: { threePEmail: true, threePBackupEmail: false, float: false, other: '' } // 1 point
      };

      const workload = calculateWorkload(assignment, {});
      expect(workload).toBe(13);
    });

    it('should calculate workload with empty specialProjects object', () => {
      const assignment = {
        dars: [0, 1], // 6 points
        cpoe: true, // 2 points
        newIncoming: ['Entity1'], // 2 points
        crossTraining: ['Entity2', 'Entity3'], // 2 points
        specialProjects: { threePEmail: false, threePBackupEmail: false, float: false, other: '' } // 0 points
      };

      const workload = calculateWorkload(assignment, {});
      expect(workload).toBe(12);
    });

    it('should calculate workload with specialProjects array format', () => {
      const assignment = {
        dars: [0, 1], // 6 points
        cpoe: true, // 2 points
        newIncoming: ['Entity1'], // 2 points
        crossTraining: ['Entity2', 'Entity3'], // 2 points
        specialProjects: ['Project1', 'Project2'] // 1 point (regardless of count)
      };

      const workload = calculateWorkload(assignment, {});
      expect(workload).toBe(13);
    });

    it('should handle empty assignments', () => {
      const result = detectConflicts({}, [], {});
      expect(result.conflicts).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.hasIssues).toBe(false);
    });

    it('should allow Float skill for DAR assignments', () => {
      const employee = {
        id: 'emp1',
        name: 'Float Employee',
        skills: ['Float']
      };

      const assignments = {
        emp1: { dars: [0] }
      };

      const result = detectConflicts(assignments, [employee], {});
      expect(result.conflicts).toHaveLength(0);
    });
  });
});
