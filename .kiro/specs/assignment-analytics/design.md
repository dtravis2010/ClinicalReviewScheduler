# Design Document: Assignment Info Panels

## Overview

This feature adds info panels to CPOE, New Incoming, Cross-Training, and Special Projects columns, matching the existing DAR info panel functionality. Each panel provides quick access to assignment history and statistics, helping supervisors make informed scheduling decisions.

## Architecture

### Component Structure

```
ScheduleGrid
├── ScheduleTableHeader
│   ├── CPOE Header (+ Info Button)
│   ├── New Incoming Header (+ Info Button)
│   ├── Cross-Training Header (+ Info Button)
│   └── Special Projects Header (+ Info Button)
├── CpoeInfoPanel (new)
├── EntityInfoPanel (new, reusable for New Incoming & Cross-Training)
├── SpecialProjectsInfoPanel (new)
└── DarInfoPanel (existing, reference implementation)
```

### Reusable Components

We'll create a generic `AssignmentInfoPanel` base component that can be specialized for each assignment type, reducing code duplication.

## Components and Interfaces

### 1. AssignmentInfoPanel (Base Component)

**Purpose**: Reusable slide-out panel with consistent styling and behavior

**Props**:
```typescript
interface AssignmentInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
```

**Features**:
- Slide-in animation from right
- Backdrop overlay
- Close on Escape key
- Close on backdrop click
- Consistent styling with existing DarInfoPanel

### 2. CpoeInfoPanel

**Purpose**: Show CPOE assignment history and statistics

**Props**:
```typescript
interface CpoeInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  currentAssignments: Assignments;
  schedules: Schedule[];
}
```

**Data Displayed**:
- Total CPOE assignments across all schedules
- List of employees who have been assigned CPOE
- Assignment frequency per employee
- Current schedule CPOE assignments
- Historical trend (increasing/decreasing CPOE assignments)

### 3. EntityInfoPanel (Reusable)

**Purpose**: Show entity-based assignment history (New Incoming & Cross-Training)

**Props**:
```typescript
interface EntityInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentType: 'newIncoming' | 'crossTraining';
  entities: Entity[];
  employees: Employee[];
  currentAssignments: Assignments;
  schedules: Schedule[];
}
```

**Data Displayed**:
- List of all entities
- For each entity:
  - Total times assigned
  - Employees who have been assigned
  - Most recent assignment date
  - Assignment frequency trend
- Entities never assigned (highlighted)
- Current schedule assignments

### 4. SpecialProjectsInfoPanel

**Purpose**: Show special projects assignment distribution

**Props**:
```typescript
interface SpecialProjectsInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  currentAssignments: Assignments;
  schedules: Schedule[];
}
```

**Data Displayed**:
- Breakdown by project type:
  - 3P Email assignments
  - 3P Backup Email assignments
  - Float assignments
  - Other projects
- For each type:
  - Total assignments
  - Current employees assigned
  - Historical assignments
- Distribution chart/visualization

## Data Models

### Assignment Statistics

```typescript
interface AssignmentStats {
  totalCount: number;
  employeeBreakdown: {
    employeeId: string;
    employeeName: string;
    count: number;
    schedules: string[]; // schedule IDs
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
}
```

### Entity Assignment Stats

```typescript
interface EntityAssignmentStats {
  entityId: string;
  entityName: string;
  totalAssignments: number;
  employees: {
    employeeId: string;
    employeeName: string;
    count: number;
    lastAssigned: string; // date
  }[];
  neverAssigned: boolean;
}
```

### Special Project Stats

```typescript
interface SpecialProjectStats {
  threePEmail: {
    count: number;
    employees: string[]; // employee IDs
  };
  threePBackupEmail: {
    count: number;
    employees: string[];
  };
  float: {
    count: number;
    employees: string[];
  };
  other: {
    count: number;
    projects: string[]; // unique project names
    employees: string[];
  };
}
```

## Utility Functions

### calculateCpoeStats()

```typescript
function calculateCpoeStats(
  schedules: Schedule[],
  employees: Employee[]
): AssignmentStats
```

Analyzes all schedules to calculate CPOE assignment statistics.

### calculateEntityStats()

```typescript
function calculateEntityStats(
  schedules: Schedule[],
  entities: Entity[],
  employees: Employee[],
  assignmentType: 'newIncoming' | 'crossTraining'
): EntityAssignmentStats[]
```

Analyzes entity-based assignments across all schedules.

### calculateSpecialProjectStats()

```typescript
function calculateSpecialProjectStats(
  schedules: Schedule[],
  employees: Employee[]
): SpecialProjectStats
```

Analyzes special projects assignments across all schedules.

## UI/UX Design

### Info Button Placement

- Add ℹ️ button to column headers
- Position: Right side of column header text
- Styling: Consistent with existing DAR info button
- Hover: Show tooltip "View assignment history"

### Panel Layout

```
┌─────────────────────────────────────┐
│ [X] Assignment Type History         │
├─────────────────────────────────────┤
│                                     │
│ 📊 Statistics Summary               │
│ • Total Assignments: 45             │
│ • Unique Employees: 8               │
│ • Current Period: 12                │
│                                     │
│ 👥 Assignment Breakdown             │
│ ┌─────────────────────────────────┐ │
│ │ Employee Name    Count  Last    │ │
│ │ John Doe         12     2w ago  │ │
│ │ Jane Smith       8      1w ago  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📈 Trend: ↗ Increasing              │
│                                     │
└─────────────────────────────────────┘
```

### Entity-Specific Panel Layout

```
┌─────────────────────────────────────┐
│ [X] New Incoming History            │
├─────────────────────────────────────┤
│                                     │
│ 🏥 Entity Statistics                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ THA - Texas Health Allen        │ │
│ │ Assigned: 15 times              │ │
│ │ Employees: John (8), Jane (7)   │ │
│ │ Last: 2 weeks ago               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ MCD - Medical City Dallas       │ │
│ │ Assigned: 12 times              │ │
│ │ Employees: Bob (12)             │ │
│ │ Last: 1 week ago                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠️ Never Assigned:                  │
│ • THP - Texas Health Plano          │
│                                     │
└─────────────────────────────────────┘
```

## Error Handling

### No Historical Data

- Display friendly message: "No historical data available yet"
- Show current schedule assignments if available
- Provide guidance: "Assignments will appear here after saving schedules"

### Missing Entities

- Handle entities that have been deleted
- Show "(Deleted Entity)" with original name if available
- Don't crash if entity references are invalid

### Performance

- Memoize statistics calculations
- Only recalculate when schedules prop changes
- Lazy load panel content (don't calculate until panel opens)

## Testing Strategy

### Unit Tests

- Test statistics calculation functions with various schedule data
- Test panel open/close behavior
- Test keyboard navigation (Escape key)
- Test backdrop click handling

### Integration Tests

- Test info button click opens correct panel
- Test switching between different info panels
- Test panel displays correct data for current schedule
- Test panel updates when schedule data changes

### Accessibility

- Ensure info buttons have proper aria-labels
- Ensure panels have proper role and aria attributes
- Test keyboard navigation
- Test screen reader announcements

## Implementation Notes

### Reuse Existing Patterns

- Follow DarInfoPanel implementation as reference
- Use same slide-out animation
- Use same styling classes
- Use same close behavior

### State Management

- Add state for each panel type in ScheduleGrid:
  - `showCpoeInfoPanel`
  - `showNewIncomingInfoPanel`
  - `showCrossTrainingInfoPanel`
  - `showSpecialProjectsInfoPanel`
- Ensure only one panel open at a time

### Performance Optimization

- Use `useMemo` for statistics calculations
- Only calculate stats when panel is open
- Cache results until schedules change

## Future Enhancements (Not in Scope)

- Export statistics to Excel
- Productivity data integration
- Trend visualizations with charts
- Comparison across date ranges
- Predictive workload balancing
