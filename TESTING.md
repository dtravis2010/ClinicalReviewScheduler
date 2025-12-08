# Testing Guide

This document explains the testing strategy and how to run tests for the Clinical Review Scheduler application.

## Overview

The application uses a comprehensive testing approach combining:
- **Unit Tests**: Test individual functions and components
- **Property-Based Tests**: Test correctness properties across many inputs
- **Integration Tests**: Test component interactions

## Test Stack

- **Vitest**: Fast unit test framework
- **@testing-library/react**: React component testing
- **fast-check**: Property-based testing library
- **jsdom**: Browser environment simulation

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Output

When you run `npm test`, you'll see output like:

```
✓ src/__tests__/services/validationService.test.js (8 tests)
✓ src/__tests__/utils/conflictDetection.test.js (13 tests)
✓ src/__tests__/hooks/useAutoSave.test.js (5 tests)

Test Files  11 passed (11)
     Tests  161 passed (161)
  Start at  14:53:09
  Duration  2.38s
```

## Test Structure

### Test Files Location

```
src/__tests__/
  helpers/
    generators.js          # Test data generators
    firebaseMocks.js       # Firebase mocking utilities
    testData.js            # Test data factories
  hooks/
    useAuth.test.jsx       # Auth hook tests
    useAutoSave.test.js    # Auto-save tests
    useUndoRedo.test.js    # Undo/redo tests (property-based)
  services/
    validationService.test.js  # Validation tests (property-based)
  utils/
    conflictDetection.test.js  # Conflict detection (property-based)
    undoRedoManager.test.js    # Undo/redo manager (property-based)
    assignmentLogic.test.js    # Assignment logic tests
    scheduleUtils.test.js      # Schedule utilities tests
    exportUtils.test.js        # Export utilities tests
    logger.test.js             # Logger tests
```

## Property-Based Testing

Property-based testing validates that certain properties hold true across many randomly generated inputs.

### What is Property-Based Testing?

Instead of writing specific test cases like:
```javascript
expect(add(2, 3)).toBe(5)
expect(add(10, 20)).toBe(30)
```

Property-based tests verify universal properties:
```javascript
// Property: Addition is commutative
fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => {
  return add(a, b) === add(b, a)
}))
```

### Our Property-Based Tests

**Validation Service** (Property 6-9):
- Schedule schema validation
- Employee schema validation
- Entity schema validation
- Validation error structure

**Conflict Detection** (Property 1-5, 25, 29-30):
- Skill-based assignment validity
- Multiple entity warning generation
- Multiple DAR column warning generation
- Schedule validation execution
- Validation error message specificity
- Conflict count accuracy
- Workload calculation consistency
- Workload imbalance detection

**Undo/Redo** (Property 18-24):
- Undo stack growth
- Undo operation correctness
- Undo-redo round trip
- Undo button state consistency
- Redo button state consistency
- Redo stack clearing on new change
- Undo/redo history persistence

### Property Test Configuration

Each property test runs **100 iterations** with randomly generated data:

```javascript
fc.assert(
  fc.property(/* generators */, (/* inputs */) => {
    // Test logic
  }),
  { numRuns: 100 } // 100 random test cases
)
```

## Test Generators

We use custom generators to create realistic test data:

```javascript
// Generate random employee
const employee = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  skills: fc.array(fc.constantFrom('DAR', 'Trace', 'CPOE', 'Float')),
  archived: fc.boolean()
})

// Generate random schedule
const schedule = fc.record({
  name: fc.string({ minLength: 1, maxLength: 200 }),
  startDate: fc.date().map(d => d.toISOString().split('T')[0]),
  endDate: fc.date().map(d => d.toISOString().split('T')[0]),
  status: fc.constantFrom('draft', 'published'),
  assignments: fc.dictionary(fc.uuid(), assignmentGen),
  darEntities: fc.dictionary(fc.nat(7), fc.array(fc.string())),
  darCount: fc.integer({ min: 3, max: 8 })
})
```

## Unit Tests

Unit tests verify specific functionality:

### Example: Auto-Save Tests

```javascript
describe('useAutoSave', () => {
  it('should debounce save calls', async () => {
    // Test that rapid changes only trigger one save
  })

  it('should handle save errors', async () => {
    // Test error handling
  })

  it('should track last saved time', async () => {
    // Test timestamp tracking
  })
})
```

### Example: Export Utilities Tests

```javascript
describe('exportToExcel', () => {
  it('should create workbook with schedule data', () => {
    // Test Excel generation
  })

  it('should filter out archived employees', () => {
    // Test data filtering
  })

  it('should include workload scores', () => {
    // Test workload calculation
  })
})
```

## Mocking

### Firebase Mocking

We mock Firebase to avoid hitting real databases during tests:

```javascript
// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn()
}))

// Mock Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn()
}))
```

### Component Mocking

We mock complex components in tests:

```javascript
vi.mock('../components/AutoSaveIndicator', () => ({
  default: () => <div>AutoSaveIndicator</div>
}))
```

## Writing New Tests

### 1. Unit Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../myModule'

describe('myFunction', () => {
  it('should do something specific', () => {
    const result = myFunction(input)
    expect(result).toBe(expected)
  })

  it('should handle edge cases', () => {
    expect(myFunction(null)).toBe(null)
    expect(myFunction(undefined)).toBe(undefined)
  })
})
```

### 2. Property-Based Test Template

```javascript
import { describe, it } from 'vitest'
import fc from 'fast-check'
import { myFunction } from '../myModule'

describe('myFunction properties', () => {
  it('should satisfy property X', () => {
    fc.assert(
      fc.property(
        fc.integer(), // generator
        (input) => {
          const result = myFunction(input)
          return result >= 0 // property to verify
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### 3. React Component Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent prop="value" />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const { user } = render(<MyComponent />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })
})
```

## Test Coverage

Current coverage (as of Phase 4 completion):

- **Total Tests**: 161
- **Test Files**: 11
- **Pass Rate**: 100%

### Coverage by Module

- ✅ Validation Service: 8 tests (property-based)
- ✅ Conflict Detection: 13 tests (property-based)
- ✅ Undo/Redo Manager: 13 tests (property-based)
- ✅ Auto-Save Hook: 5 tests
- ✅ Assignment Logic: 14 tests
- ✅ Schedule Utils: 22 tests
- ✅ Export Utils: 8 tests
- ✅ Logger: 23 tests
- ✅ Auth Hook: 15 tests
- ✅ Toast Hook: 20 tests
- ✅ Form Validation Hook: 20 tests

## Continuous Integration

Tests run automatically on:
- Every commit
- Every pull request
- Before deployment

GitHub Actions workflow ensures all tests pass before merging.

## Debugging Tests

### Run Specific Test File

```bash
npm test -- src/__tests__/utils/conflictDetection.test.js
```

### Run Tests Matching Pattern

```bash
npm test -- --grep "undo"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal"
}
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how
2. **Use Descriptive Test Names**: `it('should save schedule when valid data provided')`
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Don't hit real APIs or databases
5. **Test Edge Cases**: Empty arrays, null values, boundary conditions
6. **Keep Tests Fast**: Mock slow operations
7. **One Assertion Per Test**: Makes failures easier to diagnose
8. **Use Property-Based Tests for Correctness**: Verify universal properties

## Common Issues

### Tests Timing Out

Increase timeout in test:
```javascript
it('slow test', async () => {
  // test code
}, 10000) // 10 second timeout
```

### Firebase Mock Not Working

Ensure mocks are defined before imports:
```javascript
vi.mock('firebase/firestore')
import { myFunction } from '../myModule'
```

### Property Test Failing

Check the failing example in output:
```
Counterexample: [42, "invalid"]
```

Use this to write a specific unit test for the edge case.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)

## Questions?

If you have questions about testing:
1. Check this guide
2. Look at existing test files for examples
3. Run tests to see current coverage
4. Review test output for hints
