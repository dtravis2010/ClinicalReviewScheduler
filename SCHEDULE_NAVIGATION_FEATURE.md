# Schedule Navigation and Status Indicators - Feature Documentation

## Overview
This update adds functional navigation arrows to the ScheduleDateBanner component and visual indicators to differentiate between current and past schedules.

## Changes

### 1. Functional Navigation Arrows
**Previous State:** The left and right arrows in the ScheduleDateBanner were non-functional decorative elements.

**New State:** The arrows now allow supervisors to navigate between schedules.

#### How it Works:
- **Left Arrow (Previous)**: Navigates to the next older schedule in the list
- **Right Arrow (Next)**: Navigates to the next newer schedule in the list
- **Disabled State**: Arrows are automatically disabled when there are no more schedules in that direction
  - Opacity reduced to 30%
  - Cursor changes to "not-allowed"
  - Not clickable

#### Visual States:
- **Active**: Full opacity, hover effect with white background overlay, clickable
- **Disabled**: 30% opacity, no hover effect, not clickable

### 2. Schedule Status Visual Indicators

#### Current/Future Schedules (End Date >= Today)
- **Header Color**: Blue gradient (`header-gradient`)
  - Background: `from-thr-blue-500 to-thr-blue-600`
- **Status Badge**: Green "LIVE" or Orange "DRAFT" depending on publish status
- **Date Display**: Shows formatted date range (e.g., "Jan 2025 - Dec 2025")

#### Past Schedules (End Date < Today)
- **Header Color**: Orange gradient (`header-gradient-past`)
  - Background: `from-orange-500 to-orange-600`
- **Status Badge**: Green "LIVE" or Orange "DRAFT" depending on publish status
- **Date Display**: Shows formatted date range (e.g., "Jan 2024 - Dec 2024")

### 3. Code Changes

#### ScheduleDateBanner.jsx
```javascript
// New logic to determine schedule status
const isScheduleCurrent = () => {
  if (!endDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduleEndDate = new Date(endDate);
  scheduleEndDate.setHours(0, 0, 0, 0);
  return scheduleEndDate >= today;
};

const isCurrent = isScheduleCurrent();
const headerColorClass = isCurrent ? 'header-gradient' : 'header-gradient-past';
```

#### New Props
- `onPreviousSchedule`: Callback when previous arrow is clicked
- `onNextSchedule`: Callback when next arrow is clicked
- `canGoPrevious`: Boolean indicating if previous navigation is available
- `canGoNext`: Boolean indicating if next navigation is available

#### App.css
```css
/* New CSS class for past schedules */
.header-gradient-past {
  @apply bg-gradient-to-r from-orange-500 to-orange-600;
  @apply shadow-soft-md;
}
```

#### ScheduleGrid.jsx
```javascript
// Schedule navigation handlers
const handlePreviousSchedule = useCallback(() => {
  if (!schedules || schedules.length === 0 || !schedule || !onScheduleChange) return;
  
  const currentIndex = schedules.findIndex(s => s.id === schedule.id);
  if (currentIndex !== -1 && currentIndex < schedules.length - 1) {
    const previousSchedule = schedules[currentIndex + 1];
    onScheduleChange(previousSchedule);
  }
}, [schedules, schedule, onScheduleChange]);

const handleNextSchedule = useCallback(() => {
  if (!schedules || schedules.length === 0 || !schedule || !onScheduleChange) return;
  
  const currentIndex = schedules.findIndex(s => s.id === schedule.id);
  if (currentIndex > 0) {
    const nextSchedule = schedules[currentIndex - 1];
    onScheduleChange(nextSchedule);
  }
}, [schedules, schedule, onScheduleChange]);
```

## User Experience

### Supervisor View
1. **Multiple Schedules**: When viewing the schedule grid, supervisors can now use arrow buttons to quickly navigate between different schedules
2. **Visual Feedback**: The header color instantly indicates whether they're viewing a current or past schedule
3. **Smart Disabled State**: Arrows automatically disable when there are no more schedules in that direction

### Public User View
- Navigation arrows continue to work in the UserView page for browsing published schedules
- Status indicators help users understand which schedule is currently active

## Testing

### Automated Tests
Created comprehensive test suite in `ScheduleDateBanner.test.jsx`:
- ✅ Date range rendering
- ✅ Current schedule shows blue gradient
- ✅ Past schedule shows orange gradient
- ✅ Previous button click triggers callback
- ✅ Next button click triggers callback
- ✅ Previous button disabled when canGoPrevious is false
- ✅ Next button disabled when canGoNext is false
- ✅ Date inputs shown in edit mode
- ✅ Date inputs hidden in read-only mode
- ✅ LIVE status badge for published schedules
- ✅ DRAFT status badge for draft schedules

All 11 tests pass successfully.

### Build Status
- ✅ Build completes successfully
- ✅ All existing tests continue to pass (224 tests)
- ✅ No TypeScript/ESLint errors

## Accessibility

### Keyboard Navigation
- Arrow buttons are fully keyboard accessible
- Proper focus states with visible focus ring
- Disabled buttons are not in tab order

### Screen Reader Support
- Arrow buttons have descriptive `aria-label` attributes
- Disabled state is properly communicated to screen readers
- Status badges have semantic meaning

### ARIA Attributes
```html
<button
  onClick={onPreviousSchedule}
  disabled={!canGoPrevious || !onPreviousSchedule}
  aria-label="Previous schedule"
  title="Previous schedule"
>
```

## Visual Design

### Color Scheme
- **Current Schedules**: THR Blue (#0066CC range)
- **Past Schedules**: Orange (#F97316 range)
- **Published Badge**: Green background
- **Draft Badge**: Orange background

### Transitions
- Smooth hover effects on arrow buttons
- 200ms transition duration
- Focus ring with proper offset

## Implementation Notes

1. **Date Comparison**: Uses JavaScript Date objects with time reset to midnight for accurate date-only comparison
2. **Schedule Order**: Schedules are ordered by creation date (newest first), so "previous" means older and "next" means newer
3. **Edge Cases Handled**:
   - No end date defaults to current schedule
   - Missing schedules array doesn't break functionality
   - Missing callbacks properly disable buttons
   - Current schedule not in list doesn't cause errors

## Future Enhancements

Potential improvements for future iterations:
1. Add keyboard shortcuts for navigation (e.g., Alt+Left/Right)
2. Add schedule count indicator (e.g., "3 of 10")
3. Add quick jump to latest/oldest schedule
4. Add filtering by date range
5. Add search functionality for schedules
