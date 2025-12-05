# Quick Start Guide

## Your Application is Ready!

I've built your entire Clinical Review Scheduling application. Here's what you need to do next:

## STEP 1: Set Up Firebase (MUST DO THIS FIRST!)

### Create Firebase Project
1. Visit: https://console.firebase.google.com
2. Click "Add project"
3. Name: `ClinicalReviewScheduler`
4. Disable Google Analytics
5. Click "Create Project"

### Enable Firestore
1. Left sidebar → "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select your region
5. Click "Enable"

### Enable Authentication
1. Left sidebar → "Authentication"
2. Click "Get started"
3. Click "Email/Password"
4. Enable the toggle
5. Click "Save"

### Create Supervisor Account
1. In Authentication, click "Users" tab
2. Click "Add user"
3. Email: `supervisor@clinical.com`
4. Password: `1234` (or your choice)
5. Click "Add user"

### Get Your Firebase Config
1. Click gear icon (⚙️) → "Project settings"
2. Scroll to "Your apps"
3. Click web icon (`</>`)
4. Name: "Clinical Review App"
5. Check "Also set up Firebase Hosting"
6. Click "Register app"
7. **COPY THIS ENTIRE OBJECT:**

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "clinicalreviewscheduler.firebaseapp.com",
  projectId: "clinicalreviewscheduler",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## STEP 2: Update Firebase Config

1. Open file: `src/firebase.js`
2. Find the line that says `const firebaseConfig = {`
3. Replace everything between the `{ }` with YOUR values
4. Save the file

**Before (placeholder):**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  // etc...
};
```

**After (your actual values):**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",  // Your actual key
  authDomain: "clinicalreviewscheduler.firebaseapp.com",
  // etc...
};
```

## STEP 3: Run the App Locally

Open Terminal and run these commands:

```bash
# 1. Navigate to the project folder
cd /Users/dustintravis/Documents/GitHub/ClinicalReviewScheduler

# 2. Run the development server
npm run dev
```

You'll see:
```
➜  Local:   http://localhost:5173/ClinicalReviewScheduler/
```

Open that URL in your browser!

## STEP 4: First Time Login

1. Click "Login as Supervisor"
2. Password: `1234` (or whatever you set in Firebase)
3. You're in!

## STEP 5: Add Your Data

### Add Entities (Locations)
1. Go to "Entity Management" tab
2. Click "Add Entity"
3. Add all 19 of your entities/locations
   - Example: "Texas Health Arlington Memorial"
   - Example: "Texas Health Dallas"
   - etc.

### Add Employees
1. Go to "Employee Management" tab
2. Click "Add Employee"
3. Add all 20-25 employees
   - Enter name
   - Select skills (DAR, Trace, CPOE, Float)
   - Add email (optional)

### Create Your First Schedule
1. Go to "Schedule Management" tab
2. Click "Create New Schedule"
3. Set schedule name, start date, end date
4. Assign employees to entities
5. Click DAR checkboxes to assign DAR tasks
6. Click "Save Schedule"
7. When ready, click "Publish Schedule"

## STEP 6: Deploy to GitHub Pages

When you're ready to make it live:

```bash
# Commit and push your changes
git add .
git commit -m "Configure Firebase and initial setup"
git push origin main
```

Then:
1. Go to GitHub.com → Your repository
2. Click "Settings"
3. Click "Pages" (left sidebar)
4. Under "Source", select "GitHub Actions"
5. Wait ~2 minutes

Your app will be live at:
```
https://dustintravis.github.io/ClinicalReviewScheduler/
```

## Features You Have

✅ Supervisor login with password protection
✅ Public read-only schedule view (no login needed)
✅ Employee management (Add/Edit/Archive)
✅ Entity management (Add/Edit/Delete)
✅ Visual schedule grid with:
   - Name column with assignment history
   - 6 DAR columns (auto-disabled if not trained)
   - Entity assignment dropdown
   - Special projects field
   - 3PM Email checkboxes (Primary/Backup)
✅ Draft/Publish workflow
✅ Export to Excel
✅ Mobile responsive
✅ Texas Health Resources color scheme
✅ Automatic GitHub Pages deployment

## Need Help?

Check these files in your project:
- `README.md` - Full documentation
- `SETUP_CHECKLIST.md` - Step-by-step checklist
- `QUICK_START.md` - This file

## Terminal Commands Reference

```bash
# Run locally (for development)
npm run dev

# Build for production (test)
npm run build

# Deploy to GitHub Pages
git add .
git commit -m "Your message"
git push origin main
```

## What About CSV Import?

You mentioned you'll provide sample CSV reports later. When you're ready:
1. Share the CSV format/sample with me
2. I'll add a CSV import feature for productivity data
3. We'll add a dashboard to visualize the data

For now, everything else is complete and ready to use!
