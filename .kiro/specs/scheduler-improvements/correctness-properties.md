# Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

## Assignment Validation Properties

### Property 1: Skill-based assignment validity
*For any* employee and any task assignment, when the employee is assigned to a task requiring a specific skill, the employee must possess that skill or the Float skill.
**Validates: Requirements 2.1**

### Property 2: Multiple entity warning generation
*For any* employee assigned to multiple entities (newIncoming or crossTraining), the conflict detection system must generate a warning indicating the multiple assignments.
**Validates: Requirements 2.2, 7.1**

### Property 3: Multiple DAR column warning generation
*For any* entity assigned to multiple DAR columns, the conflict detection system must generate a warning indicating the duplicate assignment.
**Validates: Requirements 2.3, 7.2**

### Property 4: Schedule validation execution
*For any* schedule save operation, the validation system must execute all business rule checks before persisting data.
**Validates: Requirements 2.4**

### Property 5: Validation error message specificity
*For any* validation failure, the error message must include the specific field name and rule that was violated.
**Validates: Requirements 2.5**

## Data Validation Properties

### Property 6: Schedule schema validation
*For any* schedule data object, when validated against the Zod schema, invalid data must be rejected with field-specific errors.
**Validates: Requirements 3.1**

### Property 7: Employee schema validation
*For any* employee data object, when validated against the Zod schema, invalid data must be rejected with field-specific errors.
**Validates: Requirements 3.2**

### Property 8: Entity schema validation
*For any* entity data object, when validated against the Zod schema, invalid data must be rejected with field-specific errors.
**Validates: Requirements 3.3**

### Property 9: Validation error structure
*For any* validation failure, the error object must contain an array of errors with field paths and messages.
**Validates: Requirements 3.4**

### Property 10: Pre-save validation
*For any* Firestore save operation, validation must be called and must succeed before the data is written to the database.
**Validates: Requirements 3.5**

## Audit Trail Properties

### Property 11: Schedule creation audit logging
*For any* schedule creation operation, an audit log entry must be created containing userId, userEmail, timestamp, action type, and resource ID.
**Validates: Requirements 4.1**

### Property 12: Schedule update audit logging with changes
*For any* schedule update operation, an audit log entry must be created containing the changed fields with before and after values.
**Validates: Requirements 4.2**

### Property 13: Schedule publish audit logging
*For any* schedule publish operation, an audit log entry must be created with action type 'schedule.publish'.
**Validates: Requirements 4.3**

### Property 14: Employee operation audit logging
*For any* employee create, update, or archive operation, an audit log entry must be created with the appropriate action type.
**Validates: Requirements 4.4**

### Property 15: Entity operation audit logging
*For any* entity create, update, or delete operation, an audit log entry must be created with the appropriate action type.
**Validates: Requirements 4.5**

### Property 16: Audit log sort order
*For any* audit log query, the results must be sorted by timestamp in descending order (newest first).
**Validates: Requirements 4.6**

### Property 17: Audit log completeness
*For any* audit log entry displayed, it must include user, action, timestamp, and affected resource information.
**Validates: Requirements 4.7**

## Undo/Redo Properties

### Property 18: Undo stack growth
*For any* schedule change operation, the undo stack size must increase by exactly one.
**Validates: Requirements 6.1**

### Property 19: Undo operation correctness
*For any* state change followed by undo, the state must be restored to its previous value.
**Validates: Requirements 6.2**

### Property 20: Undo-redo round trip
*For any* state, performing undo followed by redo must result in the same state.
**Validates: Requirements 6.3**

### Property 21: Undo button state consistency
*For any* undo stack state, the undo button enabled state must match whether the stack is non-empty.
**Validates: Requirements 6.4**

### Property 22: Redo button state consistency
*For any* redo stack state, the redo button enabled state must match whether the stack is non-empty.
**Validates: Requirements 6.5**

### Property 23: Redo stack clearing on new change
*For any* state where redo stack is non-empty, making a new change must clear the redo stack completely.
**Validates: Requirements 6.6**

### Property 24: Undo/redo history persistence
*For any* schedule with undo/redo history, saving the schedule must preserve the history stacks.
**Validates: Requirements 6.7**

## Conflict Detection Properties

### Property 25: Conflict count accuracy
*For any* schedule state with conflicts, the displayed conflict count must equal the actual number of conflicts detected.
**Validates: Requirements 7.4**

### Property 26: Error logging completeness
*For any* error that occurs in the system, the full error details must be logged including stack trace and context.
**Validates: Requirements 8.4**

## Accessibility Properties

### Property 27: ARIA live region presence
*For any* dynamic content change, the containing element or a parent element must have an ARIA live region attribute.
**Validates: Requirements 11.3**

### Property 28: Interactive element ARIA labels
*For any* interactive element (button, link, input), it must have either an aria-label, aria-labelledby, or visible text content.
**Validates: Requirements 11.6**

## Workload Calculation Properties

### Property 29: Workload calculation consistency
*For any* employee with assignments, the calculated workload score must equal the sum of weighted assignment counts (DAR×3 + CPOE×2 + NewIncoming×2 + CrossTraining×1 + SpecialProjects×2).
**Validates: Requirements 13.1, 13.2**

### Property 30: Workload imbalance detection
*For any* set of employees with workloads, if any employee's workload deviates from the average by more than the threshold percentage, a warning must be generated.
**Validates: Requirements 13.2**

## Bulk Assignment Properties

### Property 31: Bulk assignment validation
*For any* bulk assignment operation, each individual assignment must be validated independently against skill requirements.
**Validates: Requirements 14.3**

### Property 32: Bulk assignment result completeness
*For any* bulk assignment operation, the result must include both successful and failed assignments with reasons for failures.
**Validates: Requirements 14.4, 14.5**

## Template Properties

### Property 33: Template creation preserves assignments
*For any* schedule saved as a template, the template must contain all assignment patterns from the original schedule.
**Validates: Requirements 15.2**

### Property 34: Template application copies assignments
*For any* template applied to a new schedule, all assignments from the template must be copied to the new schedule.
**Validates: Requirements 15.2**

## Backup and Recovery Properties

### Property 35: Backup data completeness
*For any* backup operation, the exported data must include all schedules, employees, and entities from the database.
**Validates: Requirements 17.1**

### Property 36: Backup data validation
*For any* backup import operation, the data must be validated against schemas before any database writes occur.
**Validates: Requirements 17.2**

### Property 37: Backup round trip integrity
*For any* data set, exporting to backup and then importing must result in equivalent data (excluding timestamps).
**Validates: Requirements 17.1, 17.2**

## Transaction Properties

### Property 38: Transaction atomicity
*For any* multi-document update operation using transactions, either all documents must be updated or none must be updated.
**Validates: Requirements 18.1, 18.2**

### Property 39: Transaction conflict detection
*For any* concurrent edit scenario, the transaction system must detect the conflict and prevent data corruption.
**Validates: Requirements 18.3**

### Property 40: Transaction retry limit
*For any* failed transaction, the retry count must not exceed the configured maximum retry limit.
**Validates: Requirements 18.4**

## History Aggregation Properties

### Property 41: History completeness
*For any* employee, the history view must include all assignments from all past schedules where the employee was assigned.
**Validates: Requirements 16.1**

### Property 42: History frequency calculation
*For any* employee with assignment history, the frequency count for each entity/task type must equal the number of times that assignment appears in the history.
**Validates: Requirements 16.3**

## Edge Cases and Error Conditions

These are important edge cases that property-based testing generators should specifically handle:

### Edge Case 1: Empty schedule validation
*For any* schedule with no assignments, validation should pass and no conflicts should be detected.

### Edge Case 2: Single employee workload
*For any* schedule with only one employee, workload imbalance warnings should not be generated.

### Edge Case 3: Maximum DAR columns
*For any* schedule with 8 DAR columns (maximum), all assignment operations should function correctly.

### Edge Case 4: Minimum DAR columns
*For any* schedule with 3 DAR columns (minimum), all assignment operations should function correctly.

### Edge Case 5: Employee with no skills
*For any* employee with an empty skills array, validation should reject any task assignments.

### Edge Case 6: Float employee universal assignment
*For any* employee with Float skill, they should be assignable to any task type (DAR, Trace, CPOE).

### Edge Case 7: Archived employee exclusion
*For any* archived employee, they should not appear in new schedule assignment options but should remain in historical schedules.

### Edge Case 8: Concurrent save operations
*For any* two concurrent save operations on the same schedule, the transaction system should handle the conflict appropriately.

### Edge Case 9: Network failure during save
*For any* save operation that fails due to network error, unsaved changes should be retained and retry should be available.

### Edge Case 10: Undo stack overflow
*For any* sequence of more than 50 changes (max history size), the oldest changes should be removed from the undo stack.

## Property Testing Strategy

### Generator Design

Property-based tests should use smart generators that:

1. **Employee Generator**: Creates employees with realistic skill combinations
   - 60% single skill (DAR, Trace, or CPOE)
   - 30% multiple skills
   - 10% Float (all skills)

2. **Entity Generator**: Creates entities with realistic names
   - Use a pool of common healthcare facility names
   - Ensure uniqueness within a test run

3. **Assignment Generator**: Creates valid and invalid assignments
   - 70% valid assignments (matching skills)
   - 30% invalid assignments (for testing validation)

4. **Schedule Generator**: Creates schedules with varying complexity
   - Small (5 employees, 5 entities, 3 DARs)
   - Medium (15 employees, 15 entities, 5 DARs)
   - Large (30 employees, 20 entities, 8 DARs)

### Test Execution

- Each property test should run at least 100 iterations
- Use shrinking to find minimal failing cases
- Seed random generators for reproducibility
- Log failing examples for regression testing

### Coverage Goals

- 80% code coverage for business logic
- 100% coverage for validation functions
- 100% coverage for conflict detection
- 90% coverage for UI components
