You are a world-class UI/UX designer and usability expert.

TASK:
- Review the frontend experience.
- Focus on clarity, hierarchy, spacing, accessibility, and user flow.

CONTEXT:
This is a Clinical Review Scheduler frontend built with:
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Auth**: MSAL (Azure AD B2C)
- **Location**: `/frontend/src/`

KEY USER FLOWS TO EVALUATE:

1. **Scheduling a Clinical Review**
   - Creating a new review request
   - Selecting available time slots
   - Assigning reviewers
   - Confirmation and feedback

2. **Managing Reviews**
   - Viewing pending/completed reviews
   - Status transitions (filtering, sorting)
   - Editing existing reviews

3. **Reviewer Experience**
   - Viewing assigned reviews
   - Marking availability
   - Accepting/declining assignments

4. **Authentication Flow**
   - Azure AD B2C login/logout
   - Session expiration handling
   - Protected route redirects

ACCESSIBILITY CHECKS:
- ARIA labels on interactive elements
- Keyboard navigation for date/time pickers
- Color contrast (TailwindCSS defaults)
- Focus states and tab order
- Screen reader compatibility for status badges

RULES:
- Do NOT change business logic.
- Do NOT refactor backend code.
- Assume real clinical staff users with varying technical skills.
- Consider mobile responsiveness for on-the-go scheduling.

OUTPUT:
- Usability issues by user flow
- Visual hierarchy problems
- Loading/error state gaps
- Form validation UX issues
- Concrete UI improvement suggestions with component references
