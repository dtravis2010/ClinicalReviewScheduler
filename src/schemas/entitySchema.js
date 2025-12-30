import { z } from 'zod';

/**
 * Schema for entity (location/facility)
 * Validates entity data
 */
export const entitySchema = z.object({
  name: z.string()
    .min(1, 'Entity name is required')
    .max(200, 'Entity name is too long')
    .refine(val => val.trim().length > 0, {
      message: 'Entity name cannot be only whitespace'
    }),
  code: z.string()
    .max(10, 'Entity code is too long')
    .optional(),
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional()
});

/**
 * Schema for creating a new entity (without timestamps)
 */
export const createEntitySchema = entitySchema.omit({
  createdAt: true,
  updatedAt: true
});

/**
 * Schema for updating an entity
 */
export const updateEntitySchema = entitySchema.partial().extend({
  updatedAt: z.any().optional()
});
