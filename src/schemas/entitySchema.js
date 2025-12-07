import { z } from 'zod';

/**
 * Validation schemas for entity-related data
 */

// Entity schema
export const entitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Entity name must be at least 2 characters').max(100, 'Entity name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  createdAt: z.any().optional(), // Firebase Timestamp
  updatedAt: z.any().optional() // Firebase Timestamp
});

// Partial entity schema for updates
export const partialEntitySchema = entitySchema.partial();

// Validate entity data
export function validateEntity(data) {
  try {
    return {
      success: true,
      data: entitySchema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors
    };
  }
}
