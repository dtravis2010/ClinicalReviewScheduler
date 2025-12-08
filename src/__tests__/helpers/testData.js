/**
 * Test data factories for creating consistent test data
 */

/**
 * Create a test employee
 */
export const createTestEmployee = (overrides = {}) => ({
  id: 'emp-1',
  name: 'John Doe',
  skills: ['DAR'],
  email: 'john@test.com',
  notes: '',
  archived: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

/**
 * Create a test entity
 */
export const createTestEntity = (overrides = {}) => ({
  id: 'entity-1',
  name: 'Texas Health Dallas',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

/**
 * Create a test schedule
 */
export const createTestSchedule = (overrides = {}) => ({
  id: 'schedule-1',
  name: 'Test Schedule',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  status: 'draft',
  assignments: {},
  darEntities: {},
  darCount: 5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

/**
 * Create a test assignment
 */
export const createTestAssignment = (overrides = {}) => ({
  dars: [],
  cpoe: false,
  newIncoming: [],
  crossTraining: [],
  specialProjects: [],
  ...overrides
});

/**
 * Create a test audit log
 */
export const createTestAuditLog = (overrides = {}) => ({
  id: 'audit-1',
  timestamp: new Date('2024-01-01'),
  userId: 'user-1',
  userEmail: 'supervisor@test.com',
  action: 'schedule.create',
  resourceType: 'schedule',
  resourceId: 'schedule-1',
  changes: {},
  metadata: {},
  ...overrides
});

/**
 * Create multiple test employees
 */
export const createTestEmployees = (count = 5) => {
  const skills = [['DAR'], ['CPOE'], ['Trace'], ['Float'], ['DAR', 'CPOE']];
  return Array.from({ length: count }, (_, i) => createTestEmployee({
    id: `emp-${i + 1}`,
    name: `Employee ${i + 1}`,
    skills: skills[i % skills.length],
    email: `employee${i + 1}@test.com`
  }));
};

/**
 * Create multiple test entities
 */
export const createTestEntities = (count = 5) => {
  const names = [
    'Texas Health Dallas',
    'Texas Health Fort Worth',
    'Texas Health Plano',
    'Medical City Dallas',
    'Baylor Scott & White'
  ];
  return Array.from({ length: count }, (_, i) => createTestEntity({
    id: `entity-${i + 1}`,
    name: names[i % names.length]
  }));
};

/**
 * Create a test schedule with assignments
 */
export const createTestScheduleWithAssignments = () => {
  const employees = createTestEmployees(3);
  const entities = createTestEntities(2);
  
  return createTestSchedule({
    assignments: {
      [employees[0].id]: {
        dars: [0, 1],
        cpoe: false,
        newIncoming: [entities[0].name],
        crossTraining: [],
        specialProjects: []
      },
      [employees[1].id]: {
        dars: [],
        cpoe: true,
        newIncoming: [],
        crossTraining: [entities[1].name],
        specialProjects: []
      },
      [employees[2].id]: {
        dars: [2],
        cpoe: false,
        newIncoming: [],
        crossTraining: [],
        specialProjects: ['Special Project 1']
      }
    },
    darEntities: {
      0: [entities[0].name],
      1: [entities[1].name],
      2: [entities[0].name]
    }
  });
};
