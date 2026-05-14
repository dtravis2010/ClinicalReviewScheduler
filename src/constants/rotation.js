/**
 * Rotation Intelligence — constants and seed data.
 *
 * The new "Rotation Intelligence" surface uses its own Firestore collections,
 * parallel to the existing schedules/employees system. This file is the source
 * of truth for the skill ladder, master entity list, column layout, and the
 * roster seeded from the team's MAR/APR 2026 spreadsheet.
 */

export const ROTATION_COLLECTIONS = {
  ROTATIONS: 'rotations',
  TEAM_MEMBERS: 'teamMembers',
  RULES: 'rules',
  VOLUME_SNAPSHOTS: 'volumeSnapshots',
};

export const RULES_DOC_ID = 'singleton';

export const ROTATION_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

// Skill ladder — order matters; promotion only moves rightward.
export const LEVELS = [
  { id: 'incoming', label: 'New Incoming', short: 'INC', color: '#0dcaf0' },
  { id: 'dar', label: 'DAR', short: 'DAR', color: '#009543' },
  { id: 'cpoe', label: 'CPOE', short: 'CPOE', color: '#003798' },
  { id: 'float', label: 'Float', short: 'FLT', color: '#a87a14' },
  { id: 'perm', label: 'Permanent', short: '★', color: '#a83a16' },
];
export const LEVEL_IDS = LEVELS.map(l => l.id);

// Column layout for the schedule grid (mirrors today's spreadsheet exactly).
export const COLUMN_DEFS = [
  { id: 'dar1', kind: 'dar', label: 'DAR 1' },
  { id: 'dar2', kind: 'dar', label: 'DAR 2' },
  { id: 'dar3', kind: 'dar', label: 'DAR 3' },
  { id: 'dar4', kind: 'dar', label: 'DAR 4' },
  { id: 'dar5', kind: 'dar', label: 'DAR 5' },
  { id: 'trn', kind: 'dar', label: 'Training DAR' },
  { id: 'cpoe', kind: 'cpoe', label: 'CPOE' },
  { id: 'inc', kind: 'free', label: 'New Incoming' },
  { id: 'cross', kind: 'free', label: 'Cross-Training' },
  { id: 'spec', kind: 'free', label: 'Special Projects' },
];
export const DAR_COLUMN_IDS = ['dar1', 'dar2', 'dar3', 'dar4', 'dar5'];

// Master entity list — every code referenced in DAR columns or New Incoming.
export const ENTITIES = [
  'THP', 'FW', 'HEB',
  'THSW', 'THAMH', 'THB',
  'THRW', 'THA', 'THC',
  'THDN', 'THK', 'THAZ',
  'THD', 'FM', 'THAL', 'THPS',
  'THS', 'THF', 'WP',
  'THFM', 'RW', 'AMF', 'SW', 'THFW',
];

// Default cluster composition (current — as of MAY/JUN 2026).
export const DEFAULT_CLUSTERS = {
  dar1: { label: 'DAR 1', entities: ['THP', 'FW', 'HEB'] },
  dar2: { label: 'DAR 2', entities: ['THSW', 'THAMH', 'THB'] },
  dar3: { label: 'DAR 3', entities: ['THRW', 'THA', 'THC'] },
  dar4: { label: 'DAR 4', entities: ['THDN', 'THK', 'THAZ'] },
  dar5: { label: 'DAR 5', entities: ['THD', 'FM', 'THAL', 'THPS'] },
  trn: { label: 'Training DAR', entities: ['THS', 'THF', 'WP'] },
};

// Team roster — names as ALL-CAPS, matching the source spreadsheet.
// Color tag is the same aesthetic grouping used in the colored-name column.
export const TEAM_ROSTER = [
  { name: 'ALYSSA', tag: 'pink' },
  { name: 'CASEY', tag: 'green' },
  { name: 'CHASITY', tag: 'pink' },
  { name: 'CLARA', tag: 'green' },
  { name: 'ERIKA', tag: 'red' },
  { name: 'GAYLA', tag: 'green' },
  { name: 'JACQUE', tag: 'pink' },
  { name: 'LINH', tag: 'blue' },
  { name: 'MARIA', tag: 'black' },
  { name: 'NACHOLE', tag: 'sky' },
  { name: 'RAQUEL', tag: 'red' },
  { name: 'SHEILA', tag: 'black' },
  { name: 'STEPHANIE', tag: 'sky' },
  { name: 'TRISH', tag: 'sky' },
  { name: 'VENUS', tag: 'blue' },
  { name: 'BRIANNA', tag: 'blue' },
  { name: 'DOMINIQUE', tag: 'red' },
  { name: 'MARIA LOPEZ GALINDO', tag: 'sky' },
  { name: 'RAVEN', tag: 'green' },
  { name: 'JORDAN', tag: 'black' },
  { name: 'DANETTE', tag: 'pink' },
];

export const TAG_COLORS = {
  pink: '#d63384',
  green: '#198754',
  red: '#dc3545',
  sky: '#0dcaf0',
  blue: '#0d6efd',
  black: '#212529',
};

// Default rule thresholds — editable from the Rules page once saved.
export const DEFAULT_RULES = {
  noRepeatDarRotations: 2,
  promoteFromCpoeAfter: 2,
  maxDarPerPerson: 1,
  maxSideRolesPerPerson: 1,
  permanentRoles: [
    { name: 'CLARA', role: 'SPECIAL PROJECT' },
  ],
  floatPool: ['ERIKA'],
  sideRoles: [
    { label: '3:01PM EMAIL', description: 'Rotates among DAR people each rotation' },
    { label: '3:01PM EMAIL BACK-UP', description: 'Backup for the 3:01PM email role' },
  ],
  clusters: DEFAULT_CLUSTERS,
};

// Side-role labels used by the engine to recognize cells worth distributing.
export const SIDE_ROLE_LABELS = [
  '3:01PM EMAIL',
  '3:01PM EMAIL BACK-UP',
];
