# Flow Spec: Clinical Review Scheduling

## Entry Points
- Supervisor opens dashboard or navigates to current schedule
- Clinician opens read-only User View on mobile/desktop

## Flow Steps (Supervisor)
1. Header: Primary actions visible (Save, Publish when eligible); secondary in overflow
2. Date Banner: Validates `startDate <= endDate`; shows current/draft status
3. Grid: Assign via cells; blocked states show helper text and allow info panels
4. Bulk Assign: Select employees → apply → live announcement + toast
5. Conflict Review: Banner summarizes conflicts; link to affected cells/panels
6. Publish: Allowed only post-conflict resolution (unchanged back-end validation)

## Design Principles
1. Progressive Disclosure: Keep secondary actions behind an overflow to reduce overload
2. Clear Progress: Auto-save indicator + live announcements for bulk actions
3. Contextual Help: Explain exclusive rules inline; info panels link from icons
4. Accessibility: Arrow-key navigation planned; visible focus states across controls

## Accessibility Requirements
- Keyboard Navigation: Roving focus across grid; Enter/Space activate cells; Tab reaches all interactive elements
- Screen Reader: Announce saves, bulk assigns, and status changes with live regions
- Visual Contrast: Strengthen popover borders in dark mode to meet AA
- Status Badges: Ensure `role="status"` with descriptive labels