import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ValidationService } from '../../services/validationService.js';
import { propertyTestConfig } from '../helpers/generators.js';

/**
 * Property-Based Tests for ValidationService
 * 
 * These tests validate that the ValidationService correctly validates
 * schedules, employees, and entities according to their Zod schemas.
 */

describe('ValidationService - Property-Based Tests', () => {
  
  // ============================================================================
  // GENERATORS FOR VALID DATA
  // ============================================================================
  
  /**
   * Generator for valid schedule data
   */
  const validScheduleArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
      .map(d => d.toISOString().split('T')[0]),
    endDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
      .map(d => d.toISOString().split('T')[0]),
    status: fc.constantFrom('draft', 'published'),
    assignments: fc.dictionary(
      fc.uuid(),
      fc.record({
        dars: fc.option(fc.array(fc.integer({ min: 0, max: 7 }), { maxLength: 3 })),
        cpoe: fc.option(fc.boolean()),
        newIncoming: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 2 })),
        crossTraining: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 2 })),
        specialProjects: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 2 }))
      })
    ),
    darEntities: fc.dictionary(
      fc.integer({ min: 0, max: 7 }).map(String),
      fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 })
    ),
    darCount: fc.integer({ min: 3, max: 8 }),
    createdAt: fc.option(fc.date()),
    updatedAt: fc.option(fc.date()),
    publishedAt: fc.option(fc.date())
  }).filter(schedule => {
    // Ensure end date is >= start date
    return new Date(schedule.endDate) >= new Date(schedule.startDate);
  });

  /**
   * Generator for valid employee data
   */
  const validEmployeeArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    skills: fc.array(
      fc.constantFrom('DAR', 'Trace', 'CPOE', 'Float'),
      { minLength: 1, maxLength: 4 }
    ).map(skills => [...new Set(skills)]), // Remove duplicates
    email: fc.option(
      fc.oneof(
        fc.emailAddress(),
        fc.constant('')
      )
    ),
    notes: fc.option(fc.string({ maxLength: 500 })),
    archived: fc.boolean(),
    createdAt: fc.option(fc.date()),
    updatedAt: fc.option(fc.date()),
    archivedAt: fc.option(fc.date())
  });

  /**
   * Generator for valid entity data
   */
  const validEntityArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 200 }),
    createdAt: fc.option(fc.date()),
    updatedAt: fc.option(fc.date())
  });

  // ============================================================================
  // GENERATORS FOR INVALID DATA
  // ============================================================================

  /**
   * Generator for invalid schedule data
   * Creates schedules that violate various validation rules
   */
  const invalidScheduleArbitrary = fc.oneof(
    // Empty name
    validScheduleArbitrary.map(s => ({ ...s, name: '' })),
    // Invalid date format
    validScheduleArbitrary.map(s => ({ ...s, startDate: '2024/01/01' })),
    validScheduleArbitrary.map(s => ({ ...s, endDate: 'invalid-date' })),
    // Invalid status
    validScheduleArbitrary.map(s => ({ ...s, status: 'pending' })),
    // End date before start date
    validScheduleArbitrary.map(s => ({ 
      ...s, 
      startDate: '2024-12-31', 
      endDate: '2024-01-01' 
    })),
    // Invalid darCount (too low)
    validScheduleArbitrary.map(s => ({ ...s, darCount: 2 })),
    // Invalid darCount (too high)
    validScheduleArbitrary.map(s => ({ ...s, darCount: 9 })),
    // Missing required field
    validScheduleArbitrary.map(s => {
      const { name, ...rest } = s;
      return rest;
    })
  );

  /**
   * Generator for invalid employee data
   */
  const invalidEmployeeArbitrary = fc.oneof(
    // Empty name
    validEmployeeArbitrary.map(e => ({ ...e, name: '' })),
    // Name too long
    validEmployeeArbitrary.map(e => ({ ...e, name: 'a'.repeat(101) })),
    // Empty skills array
    validEmployeeArbitrary.map(e => ({ ...e, skills: [] })),
    // Invalid skill
    validEmployeeArbitrary.map(e => ({ ...e, skills: ['InvalidSkill'] })),
    // Invalid email
    validEmployeeArbitrary.map(e => ({ ...e, email: 'not-an-email' })),
    // Missing required field
    validEmployeeArbitrary.map(e => {
      const { name, ...rest } = e;
      return rest;
    }),
    // Missing archived field
    validEmployeeArbitrary.map(e => {
      const { archived, ...rest } = e;
      return rest;
    })
  );

  /**
   * Generator for invalid entity data
   */
  const invalidEntityArbitrary = fc.oneof(
    // Empty name
    validEntityArbitrary.map(e => ({ ...e, name: '' })),
    // Name too long
    validEntityArbitrary.map(e => ({ ...e, name: 'a'.repeat(201) })),
    // Missing required field
    validEntityArbitrary.map(e => {
      const { name, ...rest } = e;
      return rest;
    })
  );

  // ============================================================================
  // PROPERTY 6: Schedule schema validation
  // Feature: scheduler-improvements, Property 6: Schedule schema validation
  // Validates: Requirements 3.1
  // ============================================================================

  describe('Property 6: Schedule schema validation', () => {
    it('should accept all valid schedule data', () => {
      fc.assert(
        fc.property(validScheduleArbitrary, (schedule) => {
          const result = ValidationService.validateSchedule(schedule);
          
          // Valid data should pass validation
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.errors).toBeUndefined();
        }),
        propertyTestConfig
      );
    });

    it('should reject all invalid schedule data with field-specific errors', () => {
      fc.assert(
        fc.property(invalidScheduleArbitrary, (schedule) => {
          const result = ValidationService.validateSchedule(schedule);
          
          // Invalid data should fail validation
          expect(result.success).toBe(false);
          expect(result.errors).toBeDefined();
          expect(Array.isArray(result.errors)).toBe(true);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Each error should have field and message
          result.errors.forEach(error => {
            expect(error).toHaveProperty('field');
            expect(error).toHaveProperty('message');
            expect(typeof error.field).toBe('string');
            expect(typeof error.message).toBe('string');
          });
        }),
        propertyTestConfig
      );
    });
  });

  // ============================================================================
  // PROPERTY 7: Employee schema validation
  // Feature: scheduler-improvements, Property 7: Employee schema validation
  // Validates: Requirements 3.2
  // ============================================================================

  describe('Property 7: Employee schema validation', () => {
    it('should accept all valid employee data', () => {
      fc.assert(
        fc.property(validEmployeeArbitrary, (employee) => {
          const result = ValidationService.validateEmployee(employee);
          
          // Valid data should pass validation
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.errors).toBeUndefined();
        }),
        propertyTestConfig
      );
    });

    it('should reject all invalid employee data with field-specific errors', () => {
      fc.assert(
        fc.property(invalidEmployeeArbitrary, (employee) => {
          const result = ValidationService.validateEmployee(employee);
          
          // Invalid data should fail validation
          expect(result.success).toBe(false);
          expect(result.errors).toBeDefined();
          expect(Array.isArray(result.errors)).toBe(true);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Each error should have field and message
          result.errors.forEach(error => {
            expect(error).toHaveProperty('field');
            expect(error).toHaveProperty('message');
            expect(typeof error.field).toBe('string');
            expect(typeof error.message).toBe('string');
          });
        }),
        propertyTestConfig
      );
    });
  });

  // ============================================================================
  // PROPERTY 8: Entity schema validation
  // Feature: scheduler-improvements, Property 8: Entity schema validation
  // Validates: Requirements 3.3
  // ============================================================================

  describe('Property 8: Entity schema validation', () => {
    it('should accept all valid entity data', () => {
      fc.assert(
        fc.property(validEntityArbitrary, (entity) => {
          const result = ValidationService.validateEntity(entity);
          
          // Valid data should pass validation
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.errors).toBeUndefined();
        }),
        propertyTestConfig
      );
    });

    it('should reject all invalid entity data with field-specific errors', () => {
      fc.assert(
        fc.property(invalidEntityArbitrary, (entity) => {
          const result = ValidationService.validateEntity(entity);
          
          // Invalid data should fail validation
          expect(result.success).toBe(false);
          expect(result.errors).toBeDefined();
          expect(Array.isArray(result.errors)).toBe(true);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Each error should have field and message
          result.errors.forEach(error => {
            expect(error).toHaveProperty('field');
            expect(error).toHaveProperty('message');
            expect(typeof error.field).toBe('string');
            expect(typeof error.message).toBe('string');
          });
        }),
        propertyTestConfig
      );
    });
  });

  // ============================================================================
  // PROPERTY 9: Validation error structure
  // Feature: scheduler-improvements, Property 9: Validation error structure
  // Validates: Requirements 3.4
  // ============================================================================

  describe('Property 9: Validation error structure', () => {
    it('should return consistent error structure for all validation failures', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            invalidScheduleArbitrary.map(data => ({ type: 'schedule', data })),
            invalidEmployeeArbitrary.map(data => ({ type: 'employee', data })),
            invalidEntityArbitrary.map(data => ({ type: 'entity', data }))
          ),
          (testCase) => {
            let result;
            
            switch (testCase.type) {
              case 'schedule':
                result = ValidationService.validateSchedule(testCase.data);
                break;
              case 'employee':
                result = ValidationService.validateEmployee(testCase.data);
                break;
              case 'entity':
                result = ValidationService.validateEntity(testCase.data);
                break;
            }
            
            // All validation failures must have consistent structure
            expect(result).toHaveProperty('success');
            expect(result.success).toBe(false);
            expect(result).toHaveProperty('errors');
            expect(Array.isArray(result.errors)).toBe(true);
            expect(result.errors.length).toBeGreaterThan(0);
            
            // Each error must have required fields
            result.errors.forEach(error => {
              expect(error).toHaveProperty('field');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('code');
              
              // Field must be a string (can be empty for root-level errors)
              expect(typeof error.field).toBe('string');
              
              // Message must be a non-empty string
              expect(typeof error.message).toBe('string');
              expect(error.message.length).toBeGreaterThan(0);
              
              // Code must be a string
              expect(typeof error.code).toBe('string');
            });
          }
        ),
        propertyTestConfig
      );
    });

    it('should include field paths in error structure', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            invalidScheduleArbitrary,
            invalidEmployeeArbitrary,
            invalidEntityArbitrary
          ),
          (data) => {
            // Try all validation methods
            const results = [
              ValidationService.validateSchedule(data),
              ValidationService.validateEmployee(data),
              ValidationService.validateEntity(data)
            ];
            
            // At least one should fail (since we're using invalid data)
            const failedResults = results.filter(r => !r.success);
            
            if (failedResults.length > 0) {
              failedResults.forEach(result => {
                result.errors.forEach(error => {
                  // Field path should be a string
                  expect(typeof error.field).toBe('string');
                  
                  // For nested errors, field should contain dot notation
                  // For root errors, field can be empty or contain the field name
                  expect(error.field).toBeDefined();
                });
              });
            }
          }
        ),
        propertyTestConfig
      );
    });
  });
});
