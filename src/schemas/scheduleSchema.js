import { z } from 'zod';

/**
 * Schema for special projects/assignments
 */
export const specialProjectsSchema = z.object({
  threePEmail: z.boolean().optional().default(false),
  threePBackupEmail: z.boolean().optional().default(false),
  float: z.boolean().optional().default(false),
  other: z.string().optional().default('')
});

/**
 * Schema for individual assignment
 */
export const assignmentSchema = z.object({
  dars: z.array(z.number()).optional(),
  cpoe: z.boolean().optional(),
  newIncoming: z.array(z.string()).optional(),
  crossTraining: z.array(z.string()).optional(),
  specialProjects: z.union([
    specialProjectsSchema,
    z.array(z.string()), // For backward compatibility with old data
    z.string() // For backward compatibility with old data
  ]).optional()
});

/**
 * Schema for schedule
 * Validates all schedule data including assignments and DAR entities
 */
export const scheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required').refine(val => val.trim().length > 0, {
    message: 'Schedule name cannot be only whitespace'
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)'),
  status: z.enum(['draft', 'published'], {
    errorMap: () => ({ message: 'Status must be either "draft" or "published"' })
  }),
  assignments: z.record(z.string(), assignmentSchema),
  darEntities: z.record(z.string(), z.array(z.string())),
  darCount: z.number().min(3, 'Must have at least 3 DAR columns').max(8, 'Cannot have more than 8 DAR columns'),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  publishedAt: z.any().optional()
}).refine(
  (data) => {
    // Validate that end date is not before start date
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: 'End date must be on or after start date',
    path: ['endDate']
  }
);
