# User Journey: Clinical Review Scheduling

## User Persona
- Who: Clinical Supervisor
- Goal: Assign staff to cover DAR/CPOE/new incoming/cross-training and publish a clear schedule
- Context: Desktop during morning planning; occasional mobile checks
- Success Metric: Published schedule with no conflicts and balanced workload

## Journey Stages

### Awareness
What user is doing: Opening Supervisor Dashboard
Thinking: “Do I have a draft or published schedule to edit?”
Feeling: Neutral; ready to plan
Pain points:
- Multiple actions compete at the top
- No validation hint for invalid date ranges
Opportunity: Prioritize Save/Publish, add date-range validation

### Exploration
Doing: Browsing schedules via banner arrows
Thinking: “Is this week current? Who’s assigned where?”
Feeling: Slight overload from dense buttons
Pain points:
- Status copy “Unpublish (Draft)” is confusing
- DAR cell “X” lacks semantic clarity
Opportunity: Clear status pill and DAR “Assigned” badge with tooltips

### Action
Doing: Assigning entities; bulk-assigning selected employees
Thinking: “Why can’t I assign this? What’s blocking me?”
Feeling: Frustrated if exclusive rules unclear
Pain points:
- Blocked states show disabled styling but limited inline explanations
- Popovers lack search and selected-count
Opportunity: Inline helper text for exclusive rules; add popover search and counter

### Outcome
Doing: Saving, publishing, exporting
Thinking: “Is this saved? Any conflicts left?”
Feeling: Confident when feedback is clear
Success metrics:
- Save confirmation with live announcement
- Conflict banner visible only when needed; publish allowed post-resolution