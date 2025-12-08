import { z } from 'zod';

/**
 * Schema for entity (location/facility)
 * Validates entity data
 */
export const entitySchema = z.object({
  name: z.string()
    .min(1, 'Entity name is required')
    .max(200, 'Entity name is too long'),
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
