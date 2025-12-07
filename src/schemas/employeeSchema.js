import { z } from 'zod';

/**
 * Validation schemas for employee-related data
 */

// Employee schema
export const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  skills: z.array(z.enum(['DAR', 'Trace', 'CPOE', 'Float'])).min(1, 'At least one skill required'),
  notes: z.string().max(500, 'Notes are too long').optional(),
  archived: z.boolean().default(false),
  archivedAt: z.any().optional(), // Firebase Timestamp
  createdAt: z.any().optional(), // Firebase Timestamp
  updatedAt: z.any().optional() // Firebase Timestamp
});

// Partial employee schema for updates
export const partialEmployeeSchema = employeeSchema.partial();

// Validate employee data
export function validateEmployee(data) {
  try {
    return {
      success: true,
      data: employeeSchema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors
    };
  }
}
