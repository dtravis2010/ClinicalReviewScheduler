import fc from 'fast-check';

/**
 * Generate random employees with realistic skill distributions
 * 60% single skill, 30% multiple skills, 10% Float
 */
export const employeeArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.oneof(
    fc.constant('John'),
    fc.constant('Jane'),
    fc.constant('Michael'),
    fc.constant('Sarah'),
    fc.constant('David'),
    fc.constant('Emily')
  ).chain(first => 
    fc.oneof(
      fc.constant('Smith'),
      fc.constant('Johnson'),
      fc.constant('Williams'),
      fc.constant('Brown'),
      fc.constant('Jones'),
      fc.constant('Garcia')
    ).map(last => `${first} ${last}`)
  ),
  skills: fc.oneof(
    { weight: 6, arbitrary: fc.constantFrom(['DAR'], ['CPOE'], ['Trace']) },
    { weight: 3, arbitrary: fc.subarray(['DAR', 'CPOE', 'Trace'], { minLength: 2, maxLength: 3 }) },
    { weight: 1, arbitrary: fc.constant(['Float']) }
  ),
  email: fc.option(fc.emailAddress(), { nil: '' }),
  notes: fc.option(fc.lorem({ maxCount: 1 }), { nil: '' }),
  archived: fc.constant(false),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

/**
 * Generate random entities (healthcare facilities)
 */
export const entityArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.constantFrom(
    'Texas Health Arlington Memorial',
    'Texas Health Dallas',
    'Texas Health Fort Worth',
    'Texas Health Plano',
    'Texas Health Presbyterian',
    'Medical City Dallas',
    'Baylor Scott & White',
    'Methodist Hospital',
    'Parkland Hospital',
    'UT Southwestern',
    'Children\'s Medical Center',
    'Presbyterian Hospital'
  ),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

/**
 * Generate random assignments
 */
export const assignmentArbitrary = fc.record({
  dars: fc.option(fc.array(fc.integer({ min: 0, max: 7 }), { maxLength: 3 })),
  cpoe: fc.boolean(),
  newIncoming: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 2 })),
  crossTraining: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 2 })),
  specialProjects: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 2 }))
});

/**
 * Generate random schedules
 */
export const scheduleArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 5, maxLength: 50 }),
  startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
    .map(d => d.toISOString().split('T')[0]),
  endDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
    .map(d => d.toISOString().split('T')[0]),
  status: fc.constantFrom('draft', 'published'),
  assignments: fc.dictionary(fc.uuid(), assignmentArbitrary),
  darEntities: fc.dictionary(
    fc.integer({ min: 0, max: 7 }).map(String),
    fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 3 })
  ),
  darCount: fc.integer({ min: 3, max: 8 }),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

/**
 * Configuration for property-based tests
 * Run 100 iterations per property as specified in requirements
 */
export const propertyTestConfig = {
  numRuns: 100,
  verbose: true
};
