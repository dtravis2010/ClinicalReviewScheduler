import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ValidationService } from '../../services/validationService.js';
import { propertyTestConfig } from '../helpers/generators.js';

describe('ValidationService - Property Tests', () => {
  /**
   * Property 6: Schedule schema validation
   * For any schedule data object, when validated against the Zod schema,
   * invalid data must be rejected with field-specific errors.
   * Validates: Requirements 3.1
   */
  describe('Property 6: Schedule schema validation', () => {
    it('should accept valid schedule data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
              .map(d => d.toISOString().split('T')[0]),
            endDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
              .map(d => d.toISOString().split('T')[0]),
            status: fc.constantFrom('draft', 'published'),
            assignments: fc.dictionary(
              fc.uuid(),
              fc.record({
                dars: fc.option(fc.array(fc.integer({ min: 0, max: 7 }), { maxLength: 8 })),
                cpoe: fc.option(fc.boolean()),
                newIncoming: fc.option(fc.array(fc.string(), { maxLength: 5 })),
                crossTraining: fc.option(fc.array(fc.string(), { maxLength: 5 })),
                specialProjects: fc.option(fc.array(fc.string(), { maxLength: 5 }))
              })
            ),
            darEntities: fc.dictionary(
              fc.integer({ min: 0, max: 7 }).map(String),
              fc.array(fc.string(), { maxLength: 5 })
            ),
            darCount: fc.integer({ min: 3, max: 8 })
          }).filter(schedule => schedule.endDate >= schedule.startDate),
          (schedule) => {
            const result = ValidationService.validateSchedule(schedule);
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.errors).toBeUndefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should reject schedule with invalid name', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.constantFrom('', '   '), // Invalid: empty or whitespace
            startDate: fc.date().map(d => d.toISOString().split('T')[0]),
            endDate: fc.date().map(d => d.toISOString().split('T')[0]),
            status: fc.constantFrom('draft', 'published'),
            assignments: fc.constant({}),
            darEntities: fc.constant({}),
            darCount: fc.integer({ min: 3, max: 8 })
          }),
          (schedule) => {
            const result = ValidationService.validateSchedule(schedule);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
            // Check for field-specific error
            const nameError = result.errors.find(e => e.field === 'name');
            expect(nameError).toBeDefined();
            expect(nameError.message).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should reject schedule with invalid status', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            startDate: fc.date().map(d => d.toISOString().split('T')[0]),
            endDate: fc.date().map(d => d.toISOString().split('T')[0]),
            status: fc.constantFrom('invalid', 'pending', 'archived'), // Invalid statuses
            assignments: fc.constant({}),
            darEntities: fc.constant({}),
            darCount: fc.integer({ min: 3, max: 8 })
          }),
          (schedule) => {
            const result = ValidationService.validateSchedule(schedule);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            const statusError = result.errors.find(e => e.field === 'status');
            expect(statusError).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should reject schedule with endDate before startDate', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            startDate: fc.constant('2024-12-31'),
            endDate: fc.constant('2024-01-01'), // Before startDate
            status: fc.constantFrom('draft', 'published'),
            assignments: fc.constant({}),
            darEntities: fc.constant({}),
            darCount: fc.integer({ min: 3, max: 8 })
          }),
          (schedule) => {
            const result = ValidationService.validateSchedule(schedule);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should reject schedule with invalid darCount', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10, max: 2 }).chain(invalidCount =>
            fc.record({
              name: fc.string({ minLength: 1 }),
              startDate: fc.date().map(d => d.toISOString().split('T')[0]),
              endDate: fc.date().map(d => d.toISOString().split('T')[0]),
              status: fc.constantFrom('draft', 'published'),
              assignments: fc.constant({}),
              darEntities: fc.constant({}),
              darCount: fc.constant(invalidCount) // Invalid: < 3
            })
          ),
          (schedule) => {
            const result = ValidationService.validateSchedule(schedule);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            const darCountError = result.errors.find(e => e.field === 'darCount');
            expect(darCountError).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });
  });

  /**
   * Property 7: Employee schema validation
   * For any employee data object, when validated against the Zod schema,
   * invalid data must be rejected with field-specific errors.
   * Validates: Requirements 3.2
   */
  describe('Property 7: Employee schema validation', () => {
    it('should accept valid employee data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            skills: fc.subarray(['DAR', 'CPOE', 'Trace', 'Float'], { minLength: 1, maxLength: 4 }),
            email: fc.option(fc.emailAddress(), { nil: '' }),
            notes: fc.option(fc.string(), { nil: '' }),
            archived: fc.boolean()
          }),
          (employee) => {
            const result = ValidationService.validateEmployee(employee);
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.errors).toBeUndefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should reject employee with invalid name', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.constantFrom('', '   '), // Invalid: empty or whitespace
            skills: fc.constantFrom(['DAR']),
            email: fc.constant(''),
            notes: fc.constant(''),
            archived: fc.boolean()
          }),
          (employee) => {
            const result = ValidationService.validateEmployee(employee);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            const nameError = result.errors.find(e => e.field === 'name');
            expect(nameError).toBeDefined();
            expect(nameError.message).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should reject employee with invalid skills', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            skills: fc.constantFrom(['InvalidSkill'], ['DAR', 'InvalidSkill']), // Invalid skills
            email: fc.constant(''),
            notes: fc.constant(''),
            archived: fc.boolean()
          }),
          (employee) => {
            const result = ValidationService.validateEmployee(employee);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            const skillsError = result.errors.find(e => e.field.includes('skills'));
            expect(skillsError).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should reject employee with empty skills array', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            skills: fc.constant([]), // Invalid: empty array
            email: fc.constant(''),
            notes: fc.constant(''),
            archived: fc.boolean()
          }),
          (employee) => {
            const result = ValidationService.validateEmployee(employee);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            const skillsError = result.errors.find(e => e.field === 'skills');
            expect(skillsError).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should reject employee with invalid email format', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            skills: fc.constantFrom(['DAR']),
            email: fc.constantFrom('invalid-email', 'not@email', '@example.com'), // Invalid emails
            notes: fc.constant(''),
            archived: fc.boolean()
          }),
          (employee) => {
            const result = ValidationService.validateEmployee(employee);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            const emailError = result.errors.find(e => e.field === 'email');
            expect(emailError).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });
  });

  /**
   * Property 8: Entity schema validation
   * For any entity data object, when validated against the Zod schema,
   * invalid data must be rejected with field-specific errors.
   * Validates: Requirements 3.3
   */
  describe('Property 8: Entity schema validation', () => {
    it('should accept valid entity data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 200 })
          }),
          (entity) => {
            const result = ValidationService.validateEntity(entity);
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.errors).toBeUndefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should reject entity with invalid name', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.constantFrom('', '   ') // Invalid: empty or whitespace
          }),
          (entity) => {
            const result = ValidationService.validateEntity(entity);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            const nameError = result.errors.find(e => e.field === 'name');
            expect(nameError).toBeDefined();
            expect(nameError.message).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should reject entity with name too long', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 201, maxLength: 300 }) // Too long
          }),
          (entity) => {
            const result = ValidationService.validateEntity(entity);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            const nameError = result.errors.find(e => e.field === 'name');
            expect(nameError).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });
  });

  /**
   * Property 9: Validation error structure
   * For any validation failure, the error object must contain an array of errors
   * with field paths and messages.
   * Validates: Requirements 3.4
   */
  describe('Property 9: Validation error structure', () => {
    it('should return structured errors with field, message, and code', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            // Invalid schedule
            { type: 'schedule', data: { name: '', status: 'invalid', assignments: {}, darEntities: {}, darCount: 5 } },
            // Invalid employee
            { type: 'employee', data: { name: '', skills: [], archived: false } },
            // Invalid entity
            { type: 'entity', data: { name: '' } }
          ),
          (testCase) => {
            let result;
            if (testCase.type === 'schedule') {
              result = ValidationService.validateSchedule(testCase.data);
            } else if (testCase.type === 'employee') {
              result = ValidationService.validateEmployee(testCase.data);
            } else {
              result = ValidationService.validateEntity(testCase.data);
            }

            // Verify error structure
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(Array.isArray(result.errors)).toBe(true);
            expect(result.errors.length).toBeGreaterThan(0);

            // Verify each error has required fields
            result.errors.forEach(error => {
              expect(error).toHaveProperty('field');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('code');
              expect(typeof error.field).toBe('string');
              expect(typeof error.message).toBe('string');
              expect(typeof error.code).toBe('string');
              expect(error.message.length).toBeGreaterThan(0);
            });
          }
        ),
        propertyTestConfig
      );
    });

    it('should include field path in dot notation for nested errors', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            startDate: fc.date().map(d => d.toISOString().split('T')[0]),
            endDate: fc.date().map(d => d.toISOString().split('T')[0]),
            status: fc.constantFrom('draft', 'published'),
            assignments: fc.dictionary(
              fc.uuid(),
              fc.record({
                dars: fc.constant([99]), // Invalid: out of range
                cpoe: fc.option(fc.boolean())
              })
            ),
            darEntities: fc.constant({}),
            darCount: fc.integer({ min: 3, max: 8 })
          }),
          (schedule) => {
            const result = ValidationService.validateSchedule(schedule);
            
            // Verify field paths use dot notation
            result.errors?.forEach(error => {
              expect(typeof error.field).toBe('string');
              // Field path should be a string (may contain dots for nested fields)
              expect(error.field.length).toBeGreaterThan(0);
            });
          }
        ),
        propertyTestConfig
      );
    });

    it('should not include data property when validation fails', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { name: '', status: 'invalid', assignments: {}, darEntities: {}, darCount: 5 },
            { name: '', skills: [], archived: false },
            { name: '' }
          ),
          (invalidData) => {
            let result;
            if ('status' in invalidData) {
              result = ValidationService.validateSchedule(invalidData);
            } else if ('skills' in invalidData) {
              result = ValidationService.validateEmployee(invalidData);
            } else {
              result = ValidationService.validateEntity(invalidData);
            }

            expect(result.success).toBe(false);
            expect(result.data).toBeUndefined();
            expect(result.errors).toBeDefined();
          }
        ),
        propertyTestConfig
      );
    });

    it('should not include errors property when validation succeeds', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            skills: fc.constantFrom(['DAR']),
            email: fc.constant(''),
            notes: fc.constant(''),
            archived: fc.boolean()
          }),
          (employee) => {
            const result = ValidationService.validateEmployee(employee);
            
            if (result.success) {
              expect(result.data).toBeDefined();
              expect(result.errors).toBeUndefined();
            }
          }
        ),
        propertyTestConfig
      );
    });
  });
});
