import { z } from 'zod';

/**
 * Valid audit log actions
 */
const AUDIT_ACTIONS = [
  'schedule.create',
  'schedule.update',
  'schedule.publish',
  'schedule.delete',
  'employee.create',
  'employee.update',
  'employee.archive',
  'entity.create',
  'entity.update',
  'entity.delete'
];

/**
 * Valid resource types
 */
const RESOURCE_TYPES = ['schedule', 'employee', 'entity'];

/**
 * Schema for audit log entry
 * Validates audit trail data
 */
export const auditLogSchema = z.object({
  timestamp: z.any(),
  userId: z.string().min(1, 'User ID is required'),
  userEmail: z.string().email('Invalid user email'),
  action: z.enum(AUDIT_ACTIONS, {
    errorMap: () => ({ message: `Action must be one of: ${AUDIT_ACTIONS.join(', ')}` })
  }),
  resourceType: z.enum(RESOURCE_TYPES, {
    errorMap: () => ({ message: `Resource type must be one of: ${RESOURCE_TYPES.join(', ')}` })
  }),
  resourceId: z.string().min(1, 'Resource ID is required'),
  changes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Schema for creating an audit log (without id)
 */
export const createAuditLogSchema = auditLogSchema;
