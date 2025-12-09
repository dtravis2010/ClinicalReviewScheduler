# Requirements Document: Assignment Info Panels (Part 1)

## Introduction

This feature enhances the Clinical Review Scheduler by adding info panels to all assignment types (CPOE, New Incoming, Cross-Training, and Special Projects). Currently, only DAR columns have an info button (ℹ️) that shows assignment history. Users need quick access to assignment statistics for all assignment types to make informed scheduling decisions.

## Glossary

- **Assignment Type**: Categories of work assignments including DAR, CPOE, New Incoming, Cross-Training, and Special Projects
- **Info Panel**: A slide-out panel showing historical data and statistics for a specific assignment type or entity
- **Productivity Report**: An Excel/CSV file containing actual work completed by employees, typically including entity names, employee names, and work counts
- **Workload Balance**: The distribution of assignments across employees based on actual productivity data rather than just assignment counts
- **Entity Assignment Frequency**: How often a specific entity has been assigned across all schedules
- **Assignment History**: Historical record of who was assigned to what entities and when

## Requirements

### Requirement 1

**User Story:** As a supervisor, I want to see assignment history and statistics for all assignment types, so that I can make informed scheduling decisions.

#### Acceptance Criteria

1. WHEN a user clicks an info button on the CPOE column header THEN the system SHALL display a panel showing CPOE assignment history across all schedules
2. WHEN a user clicks an info button on the New Incoming column header THEN the system SHALL display a panel showing which entities have been assigned and to whom
3. WHEN a user clicks an info button on the Cross-Training column header THEN the system SHALL display a panel showing cross-training assignment patterns
4. WHEN a user clicks an info button on the Special Projects column header THEN the system SHALL display a panel showing special project assignment distribution
5. WHEN displaying assignment history THEN the system SHALL show employee names, assignment dates, and frequency counts

### Requirement 2

**User Story:** As a supervisor, I want to see entity-specific assignment statistics, so that I can understand assignment patterns for each entity.

#### Acceptance Criteria

1. WHEN viewing an info panel for entity-based assignments THEN the system SHALL display a list of all relevant entities
2. WHEN viewing entity statistics THEN the system SHALL show how many times each entity has been assigned
3. WHEN viewing entity statistics THEN the system SHALL show which employees have been assigned to each entity
4. WHEN viewing entity statistics THEN the system SHALL show the date range of assignments
5. WHEN an entity has never been assigned THEN the system SHALL indicate this clearly

### Requirement 3

**User Story:** As a supervisor, I want consistent UI patterns across all assignment types, so that I can quickly access information without learning different interfaces.

#### Acceptance Criteria

1. WHEN viewing any assignment column header THEN the system SHALL display an info button (ℹ️) in a consistent location
2. WHEN clicking any info button THEN the system SHALL open a slide-out panel with consistent styling and layout
3. WHEN an info panel is open THEN the system SHALL allow closing it by clicking outside, pressing Escape, or clicking a close button
4. WHEN multiple info panels are available THEN the system SHALL only allow one panel to be open at a time
5. WHEN switching between info panels THEN the system SHALL smoothly transition without jarring UI changes
