import { z } from 'zod';
import { LEVEL_IDS, ROTATION_STATUS } from '../constants/rotation';

const clusterSchema = z.object({
  label: z.string(),
  entities: z.array(z.string()),
});

const assignmentSchema = z.object({
  dar: z.string().nullable().optional(),
  cpoe: z.boolean().optional(),
  incoming: z.string().nullable().optional(),
  cross: z.string().nullable().optional(),
  spec: z.string().nullable().optional(),
  trn: z.boolean().optional(),
  side: z.array(z.string()).optional(),
  reasons: z.record(z.string(), z.string()).optional(),
});

export const rotationSchema = z.object({
  id: z.string(),
  label: z.string(),
  effectiveDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum([
    ROTATION_STATUS.DRAFT,
    ROTATION_STATUS.PUBLISHED,
    ROTATION_STATUS.ARCHIVED,
  ]),
  clusters: z.record(z.string(), clusterSchema),
  assignments: z.record(z.string(), assignmentSchema),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  createdBy: z.string().nullable().optional(),
});

export const teamMemberSchema = z.object({
  name: z.string(),
  level: z.enum(LEVEL_IDS),
  permanentRole: z.string().nullable().optional(),
  coveredEntities: z.array(z.string()).default([]),
  darClustersOwned: z.array(z.string()).default([]),
  cpoeRotationsCount: z.number().int().nonnegative().default(0),
  joinedDate: z.string().nullable().optional(),
  archived: z.boolean().default(false),
  tag: z.string().optional(),
});

export const volumeSnapshotSchema = z.object({
  id: z.string(),
  takenAt: z.string(),
  source: z.string().optional(),
  perEntity: z.record(z.string(), z.number()),
});

export function validateRotation(data) {
  const result = rotationSchema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, errors: result.error.flatten() };
}

export function validateTeamMember(data) {
  const result = teamMemberSchema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, errors: result.error.flatten() };
}
