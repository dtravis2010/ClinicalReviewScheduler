# Implementation Plan: Assignment Info Panels

- [x] 1. Create base AssignmentInfoPanel component
  - Create reusable slide-out panel component with consistent styling
  - Implement backdrop overlay and close behavior
  - Add keyboard navigation (Escape key closes panel)
  - Add smooth slide-in/out animations
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Create utility functions for statistics calculations
- [x] 2.1 Implement calculateCpoeStats()
  - Calculate total CPOE assignments across all schedules
  - Break down assignments by employee
  - Determine assignment trend (increasing/decreasing/stable)
  - _Requirements: 1.1, 1.5_

- [x] 2.2 Implement calculateEntityStats()
  - Calculate entity assignment frequencies
  - Track which employees were assigned to each entity
  - Identify entities that have never been assigned
  - Support both newIncoming and crossTraining types
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.3 Implement calculateSpecialProjectStats()
  - Break down special projects by type (3P Email, 3P Backup, Float, Other)
  - Count assignments for each type
  - Track which employees are assigned to each type
  - _Requirements: 1.4, 1.5_

- [x] 3. Create CpoeInfoPanel component
  - Build panel UI showing CPOE statistics
  - Display total assignments and employee breakdown
  - Show current schedule CPOE assignments
  - Display assignment trend indicator
  - Add info button to CPOE column header in ScheduleTableHeader
  - _Requirements: 1.1, 1.5_

- [x] 4. Create EntityInfoPanel component
  - Build reusable panel for entity-based assignments
  - Display list of entities with assignment counts
  - Show employee breakdown for each entity
  - Highlight entities never assigned
  - Support both New Incoming and Cross-Training modes
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Add info buttons for New Incoming and Cross-Training
  - Add info button to New Incoming column header
  - Add info button to Cross-Training column header
  - Wire up EntityInfoPanel with correct assignment type
  - Ensure only one panel open at a time
  - _Requirements: 1.2, 1.3, 3.1, 3.4_

- [x] 6. Create SpecialProjectsInfoPanel component
  - Build panel UI showing special projects breakdown
  - Display statistics for each project type
  - Show current employees assigned to each type
  - Add info button to Special Projects column header
  - _Requirements: 1.4, 1.5_

- [x] 7. Integrate panels into ScheduleGrid
  - Add state management for all panel types
  - Ensure only one panel can be open at a time
  - Pass schedules, employees, and entities props to panels
  - Implement panel switching logic
  - _Requirements: 3.4, 3.5_

- [x] 8. Add performance optimizations
  - Memoize statistics calculations with useMemo
  - Only calculate stats when panel is open
  - Cache results until schedules data changes
  - _Requirements: All_

- [-] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
