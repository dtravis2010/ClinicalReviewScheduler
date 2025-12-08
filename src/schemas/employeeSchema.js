import { z } from 'zod';

/**
 * Valid employee skills
 */
const VALID_SKILLS = ['DAR', 'Trace', 'CPOE', 'Float'];

/**
 * Valid employee positions
 */
const VALID_POSITIONS = ['CR I', 'CR II'];

/**
 * Schema for employee
 * Validates employee data including skills, position, and optional fields
 */
export const employeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required').max(100, 'Name is too long').refine(val => val.trim().length > 0, {
    message: 'Employee name cannot be only whitespace'
  }),
  skills: z.array(
    z.enum(['DAR', 'Trace', 'CPOE', 'Float'], {
      errorMap: () => ({ message: `Skill must be one of: ${VALID_SKILLS.join(', ')}` })
    })
  ).min(1, 'At least one skill is required'),
  position: z.enum(['CR I', 'CR II'], {
    errorMap: () => ({ message: `Position must be one of: ${VALID_POSITIONS.join(', ')}` })
  }).optional(),
  can3PEmail: z.boolean().optional().default(false),
  email: z.union([
    z.string().email('Invalid email address'),
    z.literal('')
  ]).optional(),
  notes: z.string().optional(),
  archived: z.boolean(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  archivedAt: z.any().optional()
});

/**
 * Schema for creating a new employee (without timestamps)
 */
export const createEmployeeSchema = employeeSchema.omit({
  createdAt: true,
  updatedAt: true,
  archivedAt: true
});

/**
 * Schema for updating an employee (all fields optional except id)
 */
export const updateEmployeeSchema = employeeSchema.partial().extend({
  updatedAt: z.any().optional()
});
