# Clinical Review Scheduler

A professional healthcare scheduling application designed for managing clinical review assignments across multiple entities and employees.

## Features

### Core Functionality
- **Supervisor Dashboard**: Full control over schedules, employees, and entities
- **User View**: Public read-only access to published schedules
- **Employee Management**: Add, edit, and archive employees with skill tracking
- **Entity Management**: Manage locations and facilities dynamically
- **Schedule Grid**: Visual grid layout for assigning employees to tasks
- **Draft/Publish Workflow**: Work on schedules privately before publishing
- **Assignment History**: Track employee assignment history for fairness
- **Export Functionality**: Export schedules to Excel with workload summary
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices

### New Features (2024)
- **Auto-Save**: Automatic saving with 2-second debounce - never lose your work
- **Undo/Redo**: Full undo/redo support with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- **Conflict Detection**: Real-time validation with visual warnings for scheduling conflicts
- **Workload Indicators**: Color-coded workload scores showing employee assignment balance
- **Audit Trail**: Complete logging of all schedule, employee, and entity changes
- **Enhanced Error Handling**: Graceful error recovery with user-friendly messages
- **Performance Optimizations**: Faster rendering and improved responsiveness
- **Data Validation**: Comprehensive validation using Zod schemas

## Getting Started

### Prerequisites

Before you begin, make sure you have:

1. **Node.js installed** (version 18 or higher)
   - Download from: https://nodejs.org
   - Choose the "LTS" (Long Term Support) version
   - After installation, verify by opening Terminal and typing: `node --version`

2. **A Firebase account**
   - Free tier is sufficient
   - You'll need Firebase config keys (instructions below)

### Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or "Create a project"
3. Name it: `ClinicalReviewScheduler`
4. Disable Google Analytics (not needed)
5. Click "Create Project"

**Enable Firestore Database:**

6. In the left sidebar, click "Firestore Database"
7. Click "Create database"
8. Choose "Start in test mode"
9. Select your region (closest to you)
10. Click "Enable"

**Enable Authentication:**

11. In the left sidebar, click "Authentication"
12. Click "Get started"
13. Click "Email/Password" under Sign-in providers
14. Enable the toggle for "Email/Password"
15. Click "Save"

**Create Supervisor Account:**

16. Still in Authentication, click the "Users" tab
17. Click "Add user"
18. Email: `supervisor@clinical.com`
19. Password: `1234` (or your preferred password)
20. Click "Add user"

**Get Firebase Config:**

21. Click the gear icon (⚙️) next to "Project Overview"
22. Click "Project settings"
23. Scroll down to "Your apps"
24. Click the web icon (`</>`) to add a web app
25. Name it: "Clinical Review App"
26. **Check** "Also set up Firebase Hosting"
27. Click "Register app"
28. Copy the `firebaseConfig` object (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "clinicalreviewscheduler.firebaseapp.com",
  projectId: "clinicalreviewscheduler",
  storageBucket: "clinicalreviewscheduler...",
  messagingSenderId: "...",
  appId: "..."
};
```

### Step 2: Configure the Application

1. Create a new file named `.env` in the root directory (where `package.json` is).
2. Copy the contents of `.env.example` into `.env`.
3. Update the values in `.env` with your actual Firebase config keys:

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
# Optional: change the supervisor login email (defaults to supervisor@clinical.com)
VITE_SUPERVISOR_EMAIL=supervisor@clinical.com
```

4. Save the file.

### Step 3: Run the Application Locally

Open Terminal (or Command Prompt on Windows) and navigate to this project folder:

```bash
cd /path/to/ClinicalReviewScheduler
```

Run the development server:

```bash
npm run dev
```

You should see output like:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/ClinicalReviewScheduler/
➜  Network: use --host to expose
```

Open your browser and go to: `http://localhost:5173/ClinicalReviewScheduler/`

### Step 4: First-Time Setup

**Add Entities:**

1. Login as supervisor (password: `1234`)
2. Go to "Entity Management" tab
3. Add your 19 entities (locations)
   - Example: "Texas Health Arlington Memorial"
   - Example: "Texas Health Dallas"
   - etc.

**Add Employees:**

1. Go to "Employee Management" tab
2. Click "Add Employee"
3. Fill in:
   - Name
   - Skills (DAR, Trace, CPOE, or Float)
   - Email (optional)
   - Notes (optional)
4. Repeat for all ~20-25 employees

**Create a Schedule:**

1. Go to "Schedule Management" tab
2. Click "Create New Schedule"
3. Set:
   - Schedule Name (e.g., "November-December 2024")
   - Start Date
   - End Date
4. Assign employees to entities
5. Mark DAR assignments
6. Click "Save Schedule"
7. When ready, click "Publish Schedule"

## Deploying to GitHub Pages

### One-Time Setup

1. Make sure your GitHub repository is created
2. Push your code to GitHub:

```bash
git add .
git commit -m "Initial commit: Clinical Review Scheduler"
git push origin main
```

3. **Configure Repository Secrets** (Required for Firebase):
   - Go to your repository on GitHub
   - Click "Settings"
   - Click "Secrets and variables" > "Actions" in the left sidebar
   - Add the following secrets by clicking "New repository secret":
     - `VITE_FIREBASE_API_KEY` - Your Firebase API key
     - `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
     - `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
     - `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
     - `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
     - `VITE_FIREBASE_APP_ID` - Your Firebase app ID
     - `VITE_FIREBASE_MEASUREMENT_ID` - Your Firebase measurement ID (optional)

4. Enable GitHub Pages:
   - Go to your repository on GitHub
   - Click "Settings"
   - Click "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"

### Deploy

Every time you push to the `main` branch, the app will automatically deploy to GitHub Pages.

Your app will be available at:
```
https://YOUR_USERNAME.github.io/ClinicalReviewScheduler/
```

## Usage Guide

### For Supervisors

**Login:**
- Go to the app URL
- Click "Login as Supervisor"
- Enter password: `1234`

**Managing Schedules:**
- Create new schedules in "Schedule Management"
- Schedules start as "Draft" (not visible to users)
- Click employee names to view their assignment history
- Save frequently
- Publish when ready

**Managing Employees:**
- Add/Edit employees in "Employee Management"
- Archive employees who leave (they stay in old schedules)
- Skills determine which columns are available for assignment

**Managing Entities:**
- Add/Edit/Delete entities in "Entity Management"
- These appear in the "Assignment" dropdown in schedules

**Exporting:**
- Click "Export to Excel" to download the current schedule

### For Users (Read-Only)

- Visit the app URL
- No login required
- View the published schedule
- Export to Excel if needed

## New Features Guide

### Auto-Save
- Changes are automatically saved every 2 seconds
- Status indicator shows "Saving...", "Saved", or error messages
- No need to manually click save (but you still can)
- Warning appears if you try to leave with unsaved changes

### Undo/Redo
- **Undo**: Press `Ctrl+Z` (Windows/Linux) or `Cmd+Z` (Mac)
- **Redo**: Press `Ctrl+Y` (Windows/Linux) or `Cmd+Shift+Z` (Mac)
- Buttons in the header show undo/redo availability
- History preserved during your session (up to 50 changes)

### Conflict Detection
- Real-time validation as you make assignments
- **Red warnings**: Critical conflicts (e.g., employee lacks required skill)
- **Yellow warnings**: Potential issues (e.g., employee assigned to multiple entities)
- **Blue info**: Workload imbalances
- Conflicts shown in expandable banner at top of schedule
- You can still save schedules with warnings (they're advisory)

### Workload Indicators
- Color-coded badges next to each employee name:
  - **Red**: Overloaded (>150% of average workload)
  - **Yellow**: Underutilized (<50% of average workload)
  - **Blue**: Normal workload
- Hover over badge to see assignment breakdown
- Workload scores included in Excel export

### Audit Trail
- All changes automatically logged to Firestore
- Track who made what changes and when
- Includes before/after values for updates
- Accessible through Firebase Console (auditLogs collection)

## Skills Explanation

- **DAR**: Can be assigned to DAR columns
- **Trace**: Can be assigned to Trace tasks
- **CPOE**: Can be assigned to CPOE tasks
- **Float**: Trained in all tasks (DAR, Trace, CPOE)

If an employee is NOT trained for a task, that section of their row is grayed out.

## Troubleshooting

**"Firebase: Error (auth/configuration-not-found)"**
- You haven't created or updated `.env` with your Firebase config
- Follow Step 2 above

**"Cannot find module" errors**
- Run `npm install` again

**Schedule not showing for users**
- Make sure you clicked "Publish Schedule" in supervisor dashboard
- Schedules in "Draft" status are not visible to users

**GitHub Pages shows 404**
- Make sure you enabled GitHub Pages in repository Settings
- Check that "Source" is set to "GitHub Actions"
- Wait a few minutes after pushing (deployment takes time)

## Tech Stack

- **React 18** - UI framework with hooks
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Firebase** - Backend (Firestore + Auth)
- **React Router** - Client-side navigation
- **XLSX** - Excel export functionality
- **Lucide React** - Modern icon library
- **Zod** - Schema validation
- **Vitest** - Unit and property-based testing
- **fast-check** - Property-based testing library

## Project Structure

```
src/
  components/        # Reusable UI components
    schedule/                # Schedule-specific components
      ScheduleHeader.jsx     # Header with actions
      ScheduleDateBanner.jsx # Date and name editing
      ScheduleTable.jsx      # Table wrapper
      ScheduleTableHeader.jsx # Column headers
      ConflictBanner.jsx     # Conflict warnings
      WorkloadIndicator.jsx  # Workload display
    ScheduleGrid.jsx         # Main schedule grid
    EmployeeManagement.jsx   # Employee CRUD
    EntityManagement.jsx     # Entity CRUD
    AutoSaveIndicator.jsx    # Auto-save status
    EnhancedErrorBoundary.jsx # Error handling
  pages/            # Main application pages
    LoginPage.jsx            # Supervisor login
    SupervisorDashboard.jsx  # Supervisor view
    UserView.jsx             # Public schedule view
  hooks/            # Custom React hooks
    useAuth.jsx              # Authentication logic
    useAutoSave.js           # Auto-save functionality
    useUndoRedo.js           # Undo/redo system
    useConflictDetection.js  # Conflict detection
  services/         # Business logic services
    validationService.js     # Data validation
    auditService.js          # Audit logging
  utils/            # Utility functions
    conflictDetection.js     # Conflict detection logic
    undoRedoManager.js       # Undo/redo manager
    assignmentLogic.js       # Assignment utilities
    scheduleUtils.js         # Schedule formatting
    exportUtils.js           # Excel export
    errorHandler.js          # Error handling
  schemas/          # Zod validation schemas
    scheduleSchema.js        # Schedule validation
    employeeSchema.js        # Employee validation
    entitySchema.js          # Entity validation
  __tests__/        # Test files
    helpers/                 # Test utilities
    hooks/                   # Hook tests
    services/                # Service tests
    utils/                   # Utility tests
  firebase.js       # Firebase configuration
  App.jsx           # Main app component
  main.jsx          # Entry point
```

## Testing

The application includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

**Test Coverage:**
- 161 tests across 11 test files
- Unit tests for utilities and services
- Property-based tests for correctness (100 iterations each)
- React component tests with Testing Library
- Full coverage for validation, conflict detection, undo/redo, and auto-save

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Firebase Console for errors
3. Check browser console for error messages
4. Run tests to verify functionality: `npm test`

## License

This is a private healthcare scheduling tool. Not for public distribution.
