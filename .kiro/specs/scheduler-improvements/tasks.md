# Implementation Plan

## Phase 1: Testing Infrastructure & Data Validation

- [ ] 1. Set up testing infrastructure
- [x] 1.1 Install and configure Vitest
  - Install vitest, @vitest/ui, jsdom, @testing-library/react, @testing-library/jest-dom
  - Create vitest.config.js with jsdom environment and coverage settings
  - Create src/__tests__/setup.js for global test configuration
  - Add test scripts to package.json (test, test:ui, test:coverage)
  - _Requirements: 1.1, 1.3_

- [x] 1.2 Install and configure fast-check for property-based testing
  - Install fast-check package
  - Create test generators in src/__tests__/helpers/generators.js
  - Configure fast-check to run 100 iterations per property
  - _Requirements: 1.2, 1.4_

- [x] 1.3 Create Firebase mocking utilities
  - Create src/__tests__/helpers/firebaseMocks.js
  - Mock Firestore operations (getDocs, addDoc, updateDoc, deleteDoc)
  - Mock Firebase Auth operations
  - Create test data factories in src/__tests__/helpers/testData.js
  - _Requirements: 1.5_

- [ ] 2. Implement Zod validation schemas
- [x] 2.1 Create schedule validation schema
  - Create src/schemas/scheduleSchema.js
  - Define assignmentSchema with all fields (dars, cpoe, newIncoming, crossTraining, specialProjects)
  - Define scheduleSchema with name, dates, status, assignments, darEntities, darCount
  - Add date range validation (endDate >= startDate)
  - _Requirements: 3.1_

- [x] 2.2 Create employee validation schema
  - Create src/schemas/employeeSchema.js
  - Define employeeSchema with name, skills, email, notes, archived
  - Add skills enum validation (DAR, Trace, CPOE, Float)
  - Add optional email validation
  - _Requirements: 3.2_

- [x] 2.3 Create entity validation schema
  - Create src/schemas/entitySchema.js
  - Define entitySchema with name and timestamps
  - Add name length validation
  - _Requirements: 3.3_

- [x] 2.4 Create audit log validation schema
  - Create src/schemas/auditLogSchema.js
  - Define auditLogSchema with all required fields
  - Add action enum validation
  - _Requirements: 4.1_

- [x] 2.5 Export all schemas from index file
  - Create src/schemas/index.js
  - Export all schemas for easy importing
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Create validation service
- [x] 3.1 Implement ValidationService class
  - Create src/services/validationService.js
  - Implement validateSchedule method
  - Implement validateEmployee method
  - Implement validateEntity method
  - Return structured validation results with success/errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4_


- [x] 3.2 Write property tests for validation service
  - **Property 6: Schedule schema validation**
  - **Validates: Requirements 3.1**
  - **Property 7: Employee schema validation**
  - **Validates: Requirements 3.2**
  - **Property 8: Entity schema validation**
  - **Validates: Requirements 3.3**
  - **Property 9: Validation error structure**
  - **Validates: Requirements 3.4**

- [ ] 4. Write unit tests for existing utilities
- [x] 4.1 Write tests for logger utility
  - Test error, warn, info, debug methods
  - Test environment-based logging
  - _Requirements: Testing infrastructure_

- [x] 4.2 Write tests for existing hooks
  - Test useAuth hook
  - Test useToast hook
  - Test useFormValidation hook
  - _Requirements: Testing infrastructure_

- [x] 5. Checkpoint - Ensure all Phase 1 tests pass
  - All 80 tests passing (5 test files, 80 tests total)
  - Fixed Zod v4 API change (error.issues instead of error.errors)
  - Fixed test generators to use undefined instead of null for optional fields
  - Fixed email generator to produce valid emails that pass Zod validation

## Phase 2: Audit Trail & Error Handling

- [ ] 6. Implement audit trail system
- [x] 6.1 Create AuditService class
  - Create src/services/auditService.js
  - Implement log method for creating audit entries
  - Implement getLogsForResource method
  - Implement getRecentLogs method
  - Handle errors gracefully (don't break main operations)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6.2 Create auditLogs Firestore collection
  - Add collection to Firebase (will be created on first write)
  - Document schema in design
  - _Requirements: 4.1_

- [x] 6.3 Integrate audit logging into schedule operations
  - Add audit log to createNewSchedule in SupervisorDashboard
  - Add audit log to saveSchedule with changed fields detection
  - Add audit log to publishSchedule
  - Pass current user to audit service
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.4 Integrate audit logging into employee operations
  - Add audit log to employee create in EmployeeManagement
  - Add audit log to employee update
  - Add audit log to employee archive
  - _Requirements: 4.4_

- [x] 6.5 Integrate audit logging into entity operations
  - Add audit log to entity create in Settings
  - Add audit log to entity update
  - Add audit log to entity delete
  - _Requirements: 4.5_

- [x] 6.6 Write property tests for audit service
  - **Property 11: Schedule creation audit logging**
  - **Validates: Requirements 4.1**
  - **Property 12: Schedule update audit logging with changes**
  - **Validates: Requirements 4.2**
  - **Property 13: Schedule publish audit logging**
  - **Validates: Requirements 4.3**
  - **Property 14: Employee operation audit logging**
  - **Validates: Requirements 4.4**
  - **Property 15: Entity operation audit logging**
  - **Validates: Requirements 4.5**
  - **Property 16: Audit log sort order**
  - **Validates: Requirements 4.6**

- [ ] 7. Implement enhanced error handling
- [x] 7.1 Create error handling utilities
  - Create src/utils/errorHandler.js
  - Implement AppError class
  - Implement ErrorCodes enum
  - Implement ErrorHandler class with handleFirebaseError, handleValidationError
  - _Requirements: 8.1, 8.4_

- [x] 7.2 Create EnhancedErrorBoundary component
  - Create src/components/EnhancedErrorBoundary.jsx
  - Implement error catching and logging
  - Add recovery options (Try Again, Reload, Go Home)
  - Add error count tracking
  - Show dev-only error details
  - _Requirements: 8.5_

- [x] 7.3 Replace existing ErrorBoundary with EnhancedErrorBoundary
  - Update src/App.jsx to use EnhancedErrorBoundary
  - Test error recovery flows
  - _Requirements: 8.5_

- [x] 7.4 Add error handling to Firebase operations
  - Wrap all Firebase calls in try-catch
  - Use ErrorHandler to transform errors
  - Display user-friendly error messages
  - Add retry options for network errors
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 7.5 Write property tests for error handling
  - **Property 26: Error logging completeness**
  - **Validates: Requirements 8.4**

- [x] 8. Checkpoint - Ensure all Phase 2 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: UX Improvements (Auto-save, Undo/Redo, Conflicts)

- [ ] 9. Implement auto-save functionality
- [x] 9.1 Create useAutoSave hook
  - Create src/hooks/useAutoSave.js
  - Implement debouncing (2 second delay)
  - Track saving state (isSaving, lastSaved, error)
  - Implement forceSave method
  - Detect data changes using JSON comparison
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9.2 Create AutoSaveIndicator component
  - Create src/components/AutoSaveIndicator.jsx
  - Show "Saving..." when saving
  - Show "Saved at [time]" when complete
  - Show error message on failure
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 9.3 Integrate auto-save into ScheduleGrid
  - Add useAutoSave hook to ScheduleGrid
  - Pass schedule data and save function
  - Display AutoSaveIndicator in header
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9.4 Add unsaved changes warning on navigation
  - Add beforeunload event listener
  - Prompt user if unsaved changes exist
  - _Requirements: 5.5_

- [x] 9.5 Write unit tests for auto-save
  - Test debouncing behavior
  - Test save success/failure
  - Test forceSave
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 10. Implement undo/redo system
- [x] 10.1 Create UndoRedoManager class
  - Create src/utils/undoRedoManager.js
  - Implement addChange, undo, redo methods
  - Implement canUndo, canRedo methods
  - Implement stack size limits (50 items)
  - _Requirements: 6.1, 6.2, 6.3, 6.6_

- [x] 10.2 Create useUndoRedo hook
  - Create src/hooks/useUndoRedo.js
  - Wrap UndoRedoManager in React hook
  - Provide state, setState, undo, redo, canUndo, canRedo
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 10.3 Integrate undo/redo into ScheduleGrid
  - Replace useState with useUndoRedo for assignments
  - Add Undo/Redo buttons to header
  - Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  - Disable buttons when stacks are empty
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10.4 Preserve undo/redo history on save
  - Store history in component state (not persisted to DB)
  - Clear history only on explicit user action or page reload
  - _Requirements: 6.7_

- [x] 10.5 Write property tests for undo/redo
  - **Property 18: Undo stack growth**
  - **Validates: Requirements 6.1**
  - **Property 19: Undo operation correctness**
  - **Validates: Requirements 6.2**
  - **Property 20: Undo-redo round trip**
  - **Validates: Requirements 6.3**
  - **Property 21: Undo button state consistency**
  - **Validates: Requirements 6.4**
  - **Property 22: Redo button state consistency**
  - **Validates: Requirements 6.5**
  - **Property 23: Redo stack clearing on new change**
  - **Validates: Requirements 6.6**
  - **Property 24: Undo/redo history persistence**
  - **Validates: Requirements 6.7**

- [ ] 11. Implement conflict detection system
- [x] 11.1 Create conflict detection utilities
  - Create src/utils/conflictDetection.js
  - Implement detectConflicts function
  - Implement calculateWorkload function
  - Implement detectWorkloadImbalances function
  - _Requirements: 2.1, 2.2, 2.3, 7.1, 7.2, 7.4_

- [x] 11.2 Create useConflictDetection hook
  - Create src/hooks/useConflictDetection.js
  - Memoize conflict detection results
  - Return conflicts, warnings, workloadMap, hasIssues
  - _Requirements: 2.2, 2.3, 7.1, 7.2, 7.4_

- [x] 11.3 Create ConflictBanner component
  - Create src/components/schedule/ConflictBanner.jsx
  - Display conflict count
  - Show list of conflicts with details
  - Allow navigation to conflicting items
  - Allow dismissing warnings
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11.4 Integrate conflict detection into ScheduleGrid
  - Add useConflictDetection hook
  - Display ConflictBanner when conflicts exist
  - Highlight conflicting cells
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [x] 11.5 Add validation before save
  - Run conflict detection before save
  - Show warnings but allow save to proceed
  - Log validation results
  - _Requirements: 2.4, 2.5_

- [x] 11.6 Write property tests for conflict detection
  - **Property 1: Skill-based assignment validity**
  - **Validates: Requirements 2.1**
  - **Property 2: Multiple entity warning generation**
  - **Validates: Requirements 2.2, 7.1**
  - **Property 3: Multiple DAR column warning generation**
  - **Validates: Requirements 2.3, 7.2**
  - **Property 4: Schedule validation execution**
  - **Validates: Requirements 2.4**
  - **Property 5: Validation error message specificity**
  - **Validates: Requirements 2.5**
  - **Property 25: Conflict count accuracy**
  - **Validates: Requirements 7.4**

- [ ] 12. Implement workload indicators
- [x] 12.1 Create WorkloadIndicator component
  - Create src/components/schedule/WorkloadIndicator.jsx
  - Display workload score for employee
  - Color-code by load level (low/normal/high)
  - Show tooltip with assignment breakdown
  - _Requirements: 13.1, 13.2_

- [x] 12.2 Integrate workload indicators into EmployeeRow
  - Add WorkloadIndicator to each employee row
  - Calculate workload using calculateWorkload utility
  - Highlight employees with imbalanced workload
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 12.3 Add workload metrics to export
  - Include workload scores in Excel export
  - Add workload summary sheet
  - _Requirements: 13.5_

- [x] 12.4 Write property tests for workload calculation
  - **Property 29: Workload calculation consistency**
  - **Validates: Requirements 13.1, 13.2**
  - **Property 30: Workload imbalance detection**
  - **Validates: Requirements 13.2**

- [ ] 13. Implement bulk assignment tools
- [ ] 13.1 Add multi-select for employees
  - Add checkbox column to employee rows
  - Add "Select All" checkbox in header
  - Track selected employees in state
  - _Requirements: 14.1_

- [ ] 13.2 Create BulkAssignmentModal component
  - Create src/components/schedule/BulkAssignmentModal.jsx
  - Allow selecting entity/task for bulk assignment
  - Show preview of assignments
  - _Requirements: 14.2_

- [ ] 13.3 Implement bulk assignment logic
  - Validate each assignment individually
  - Collect successful and failed assignments
  - Apply successful assignments to schedule
  - _Requirements: 14.3, 14.4_

- [ ] 13.4 Show bulk assignment results
  - Display summary of successful assignments
  - Display list of failed assignments with reasons
  - _Requirements: 14.4, 14.5_

- [ ] 13.5 Write property tests for bulk assignment
  - **Property 31: Bulk assignment validation**
  - **Validates: Requirements 14.3**
  - **Property 32: Bulk assignment result completeness**
  - **Validates: Requirements 14.4, 14.5**

- [ ] 14. Implement schedule templates
- [ ] 14.1 Create scheduleTemplates Firestore collection
  - Add collection to Firebase
  - Document schema
  - _Requirements: 15.1_

- [ ] 14.2 Create TemplateService class
  - Create src/services/templateService.js
  - Implement saveAsTemplate method
  - Implement getTemplates method
  - Implement applyTemplate method
  - Implement deleteTemplate method
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 14.3 Add "Save as Template" button to ScheduleGrid
  - Add button to header
  - Prompt for template name
  - Save current assignments as template
  - _Requirements: 15.1_

- [ ] 14.4 Add "Load Template" functionality
  - Add template selector to schedule creation
  - Apply template assignments to new schedule
  - Prompt for schedule name and dates
  - _Requirements: 15.2, 15.3_

- [ ] 14.5 Add template management UI
  - Show list of templates in Settings
  - Allow deleting templates
  - Show template metadata
  - _Requirements: 15.4, 15.5_

- [ ] 14.6 Write property tests for templates
  - **Property 33: Template creation preserves assignments**
  - **Validates: Requirements 15.2**
  - **Property 34: Template application copies assignments**
  - **Validates: Requirements 15.2**

- [x] 15. Checkpoint - Ensure all Phase 3 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Code Refactoring & Performance

- [ ] 16. Refactor ScheduleGrid component
- [ ] 16.1 Extract ScheduleHeader component
  - Create src/components/schedule/ScheduleHeader.jsx
  - Move action buttons and status indicators
  - Props: onSave, onExport, onHistory, status, hasChanges
  - _Requirements: 9.1_

- [ ] 16.2 Extract ScheduleDateBanner component
  - Create src/components/schedule/ScheduleDateBanner.jsx
  - Move schedule name and date editing
  - Props: name, startDate, endDate, onChange, readOnly
  - _Requirements: 9.1_

- [ ] 16.3 Extract ScheduleTable component
  - Create src/components/schedule/ScheduleTable.jsx
  - Move table structure and scroll handling
  - Props: children, className
  - _Requirements: 9.1_

- [ ] 16.4 Extract ScheduleTableHeader component
  - Create src/components/schedule/ScheduleTableHeader.jsx
  - Move column headers and DAR configuration
  - Props: darColumns, darEntities, onDarEntityChange, readOnly
  - _Requirements: 9.1_

- [ ] 16.5 Extract EmployeeRow component
  - Create src/components/schedule/EmployeeRow.jsx
  - Move single employee row rendering
  - Props: employee, assignment, darColumns, darEntities, onAssignmentChange
  - _Requirements: 9.1_

- [ ] 16.6 Extract cell components (DARCell, CPOECell, AssignmentCell)
  - Create src/components/schedule/DARCell.jsx
  - Create src/components/schedule/CPOECell.jsx
  - Create src/components/schedule/AssignmentCell.jsx
  - Move cell rendering logic
  - _Requirements: 9.1_

- [ ] 16.7 Extract EntitySelector component
  - Create src/components/schedule/EntitySelector.jsx
  - Move entity selection popup logic
  - Props: entities, selected, onChange, onClose
  - _Requirements: 9.1_

- [ ] 16.8 Update ScheduleGrid to use new components
  - Import and use all extracted components
  - Pass props correctly
  - Ensure functionality is preserved
  - _Requirements: 9.3_

- [ ] 16.9 Write component tests for refactored components
  - Test ScheduleHeader
  - Test ScheduleDateBanner
  - Test EmployeeRow
  - Test cell components
  - _Requirements: 9.3_

- [ ] 17. Extract business logic to utilities
- [x] 17.1 Create assignment logic utilities
  - Create src/utils/assignmentLogic.js
  - Extract canAssignDAR function
  - Extract getAvailableEntitiesForDar function
  - Extract getAvailableEntitiesForAssignment function
  - Add JSDoc comments
  - _Requirements: 9.2, 9.4_

- [x] 17.2 Create schedule utilities
  - Create src/utils/scheduleUtils.js
  - Extract formatEntityList function
  - Extract getEntityShortCode function
  - Extract formatDateRange function
  - Add JSDoc comments
  - _Requirements: 9.2, 9.4_

- [x] 17.3 Create export utilities
  - Create src/utils/exportUtils.js
  - Extract exportToExcel logic
  - Add JSDoc comments
  - _Requirements: 9.2, 9.4_

- [x] 17.4 Write unit tests for utility functions
  - Test assignment logic utilities
  - Test schedule utilities
  - Test export utilities
  - _Requirements: 9.2_

- [ ] 18. Add JSDoc comments
- [x] 18.1 Add JSDoc to all services
  - Document ValidationService
  - Document AuditService
  - Document TemplateService
  - _Requirements: 9.4_

- [x] 18.2 Add JSDoc to all utilities
  - Document errorHandler
  - Document conflictDetection
  - Document undoRedoManager
  - Document assignmentLogic
  - Document scheduleUtils
  - _Requirements: 9.4_

- [x] 18.3 Add JSDoc to all hooks
  - Document useAutoSave
  - Document useUndoRedo
  - Document useConflictDetection
  - _Requirements: 9.4_

- [ ] 19. Implement performance optimizations
- [ ] 19.1 Add React.memo to pure components
  - Memoize EmployeeRow
  - Memoize cell components
  - Memoize AutoSaveIndicator
  - Memoize WorkloadIndicator
  - _Requirements: 10.1_

- [ ] 19.2 Add useMemo for expensive calculations
  - Memoize conflict detection results
  - Memoize workload calculations
  - Memoize filtered employee lists
  - _Requirements: 10.3_

- [ ] 19.3 Add useCallback for event handlers
  - Memoize assignment change handlers
  - Memoize save handlers
  - Memoize navigation handlers
  - _Requirements: 10.1_

- [ ] 19.4 Optimize Firestore queries
  - Add limits to all queries
  - Add indexes for common queries
  - Implement pagination for large lists
  - _Requirements: 10.2_

- [ ] 19.5 Improve loading states
  - Add skeleton loaders for all data loading
  - Show progress for long operations
  - _Requirements: 10.4, 19.1_

- [ ] 20. Checkpoint - Ensure all Phase 4 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Accessibility

- [ ] 21. Implement keyboard navigation
- [ ] 21.1 Create useKeyboardNavigation hook
  - Create src/hooks/useKeyboardNavigation.js
  - Implement arrow key navigation for grid
  - Implement Home/End keys
  - Implement Enter/Space for activation
  - _Requirements: 11.2_

- [ ] 21.2 Integrate keyboard navigation into ScheduleGrid
  - Add useKeyboardNavigation hook
  - Track focused cell
  - Show focus indicators
  - _Requirements: 11.1, 11.2_

- [ ] 21.3 Add keyboard shortcuts
  - Ctrl+Z for undo
  - Ctrl+Y for redo
  - Ctrl+S for save
  - Escape to close modals
  - _Requirements: 11.2_

- [ ] 22. Implement focus management
- [ ] 22.1 Create useFocusTrap hook
  - Create src/hooks/useFocusTrap.js
  - Trap focus within modals
  - Return focus to trigger element on close
  - _Requirements: 11.4, 11.5_

- [ ] 22.2 Integrate focus trap into Modal component
  - Add useFocusTrap to Modal
  - Test focus behavior
  - _Requirements: 11.4, 11.5_

- [ ] 22.3 Add visible focus indicators
  - Update CSS for focus states
  - Ensure focus is always visible
  - Test with keyboard navigation
  - _Requirements: 11.1_

- [ ] 23. Implement ARIA live regions
- [ ] 23.1 Create AriaLiveRegion component
  - Create src/components/AriaLiveRegion.jsx
  - Support polite and assertive modes
  - Announce dynamic changes
  - _Requirements: 11.3_

- [ ] 23.2 Add ARIA live regions for dynamic content
  - Add to auto-save indicator
  - Add to conflict banner
  - Add to toast notifications
  - _Requirements: 11.3_

- [ ] 23.3 Write property tests for ARIA
  - **Property 27: ARIA live region presence**
  - **Validates: Requirements 11.3**
  - **Property 28: Interactive element ARIA labels**
  - **Validates: Requirements 11.6**

- [ ] 24. Add ARIA labels to interactive elements
- [ ] 24.1 Audit all buttons and links
  - Ensure all have aria-label or visible text
  - Add aria-describedby where needed
  - _Requirements: 11.6_

- [ ] 24.2 Add ARIA labels to form inputs
  - Ensure all inputs have labels
  - Add aria-invalid for validation errors
  - Add aria-describedby for error messages
  - _Requirements: 11.6_

- [ ] 24.3 Add ARIA labels to grid cells
  - Add aria-label to each cell
  - Add aria-pressed for toggle cells
  - Add role="grid" and role="gridcell"
  - _Requirements: 11.6_

- [ ] 25. Test accessibility
- [ ] 25.1 Test with keyboard only
  - Navigate entire application with keyboard
  - Ensure all functionality is accessible
  - _Requirements: 11.1, 11.2_

- [ ] 25.2 Test with screen reader
  - Test with NVDA or JAWS
  - Ensure all content is announced
  - Ensure navigation is logical
  - _Requirements: 11.3, 11.6_

- [ ] 25.3 Test zoom to 200%
  - Ensure no horizontal scrolling
  - Ensure all content is readable
  - Ensure functionality is preserved
  - _Requirements: 11.7_

- [ ] 26. Checkpoint - Ensure all Phase 5 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Additional Features

- [ ] 27. Implement schedule comparison
- [ ] 27.1 Create ScheduleComparison component
  - Create src/components/schedule/ScheduleComparison.jsx
  - Display two schedules side-by-side
  - Highlight differences
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 27.2 Add comparison mode to SupervisorDashboard
  - Add "Compare Schedules" button
  - Allow selecting two schedules
  - Show ScheduleComparison component
  - _Requirements: 12.1, 12.4, 12.5_

- [ ] 28. Implement enhanced history view
- [ ] 28.1 Create HistoryService class
  - Create src/services/historyService.js
  - Implement getEmployeeHistory method
  - Implement calculateFrequency method
  - Implement calculateTrends method
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 28.2 Enhance EmployeeHistoryModal
  - Update src/components/EmployeeHistoryModal.jsx
  - Show assignment frequency by entity
  - Show workload trends over time
  - Group by schedule period
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 28.3 Add history export
  - Add "Export History" button
  - Generate Excel report with trends
  - _Requirements: 16.5_

- [ ] 28.4 Write property tests for history
  - **Property 41: History completeness**
  - **Validates: Requirements 16.1**
  - **Property 42: History frequency calculation**
  - **Validates: Requirements 16.3**

- [ ] 29. Implement backup and recovery
- [ ] 29.1 Create BackupService class
  - Create src/services/backupService.js
  - Implement exportBackup method
  - Implement importBackup method
  - Implement validateBackup method
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 29.2 Add backup UI to Settings
  - Add "Export Backup" button
  - Add "Import Backup" button
  - Show backup validation results
  - Confirm before overwriting data
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 29.3 Write property tests for backup
  - **Property 35: Backup data completeness**
  - **Validates: Requirements 17.1**
  - **Property 36: Backup data validation**
  - **Validates: Requirements 17.2**
  - **Property 37: Backup round trip integrity**
  - **Validates: Requirements 17.1, 17.2**

- [ ] 30. Implement transaction handling
- [ ] 30.1 Create TransactionService class
  - Create src/services/transactionService.js
  - Implement runTransaction method
  - Implement retry logic with limits
  - Implement conflict detection
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 30.2 Use transactions for multi-document updates
  - Update schedule save to use transactions
  - Update bulk operations to use transactions
  - _Requirements: 18.1, 18.2_

- [ ] 30.3 Write property tests for transactions
  - **Property 38: Transaction atomicity**
  - **Validates: Requirements 18.1, 18.2**
  - **Property 39: Transaction conflict detection**
  - **Validates: Requirements 18.3**
  - **Property 40: Transaction retry limit**
  - **Validates: Requirements 18.4**

- [ ] 31. Improve loading states
- [ ] 31.1 Create enhanced skeleton loaders
  - Create src/components/Skeleton.jsx variants
  - Match content structure
  - _Requirements: 19.1_

- [ ] 31.2 Add loading states to all data fetching
  - Show skeletons during initial load
  - Show progress for long operations
  - Show reload button on error
  - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [ ] 32. Improve input validation feedback
- [ ] 32.1 Add real-time validation to forms
  - Validate on blur
  - Show error messages below fields
  - Show success indicators
  - _Requirements: 20.1, 20.2, 20.3_

- [ ] 32.2 Focus first invalid field on submit
  - Implement focus management on validation error
  - Scroll to first error
  - _Requirements: 20.4_

- [ ] 32.3 Clear errors on correction
  - Remove error message when field becomes valid
  - Update validation state immediately
  - _Requirements: 20.5_

- [ ] 33. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Documentation & Polish

- [ ] 34. Update documentation
- [ ] 34.1 Update README.md
  - Document new features
  - Update setup instructions
  - Add troubleshooting for new features
  - _Requirements: All_

- [ ] 34.2 Create TESTING.md
  - Document testing strategy
  - Explain how to run tests
  - Explain property-based testing
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 34.3 Create ARCHITECTURE.md
  - Document component structure
  - Document data flow
  - Document service layer
  - _Requirements: 9.1, 9.2_

- [ ] 34.4 Add inline help text
  - Add tooltips for complex features
  - Add help icons with explanations
  - _Requirements: All_

- [ ] 35. Final testing and QA
- [ ] 35.1 Run full test suite
  - Ensure 100% of tests pass
  - Check code coverage (target: 80%+)
  - _Requirements: All_

- [ ] 35.2 Manual testing
  - Test all user workflows
  - Test error scenarios
  - Test accessibility
  - Test on different browsers
  - _Requirements: All_

- [ ] 35.3 Performance testing
  - Test with large datasets
  - Measure load times
  - Identify bottlenecks
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 36. Final checkpoint - Ready for deployment
  - Ensure all tests pass, ask the user if questions arise.
