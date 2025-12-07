import { z } from 'zod';

/**
 * Validation schemas for schedule-related data
 */

// Assignment schema
export const assignmentSchema = z.object({
  dars: z.array(z.number()).optional().default([]),
  newIncoming: z.union([z.string(), z.array(z.string())]).optional(),
  crossTraining: z.union([z.string(), z.array(z.string())]).optional()
});

// Schedule schema
export const scheduleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Schedule name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  assignments: z.record(assignmentSchema).optional().default({}),
  darEntities: z.record(z.union([z.string(), z.array(z.string())])).optional().default({}),
  darCount: z.number().int().positive().optional().default(5),
  createdAt: z.any().optional(), // Firebase Timestamp
  updatedAt: z.any().optional(), // Firebase Timestamp
  publishedAt: z.any().optional() // Firebase Timestamp
});

// Partial schedule schema for updates
export const partialScheduleSchema = scheduleSchema.partial();

// Validate schedule data
export function validateSchedule(data) {
  try {
    return {
      success: true,
      data: scheduleSchema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors
    };
  }
}
