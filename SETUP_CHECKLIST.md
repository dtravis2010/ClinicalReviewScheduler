# Setup Checklist

Follow these steps in order. Check off each step as you complete it.

## Before You Start

- [ ] Node.js is installed (verify with: `node --version`)
- [ ] You're in the project folder in Terminal/Command Prompt

## Firebase Setup (Required First!)

- [ ] Created Firebase project at https://console.firebase.google.com
- [ ] Enabled Firestore Database (test mode)
- [ ] Enabled Email/Password Authentication
- [ ] Created supervisor user: `supervisor@clinical.com` with password `1234`
- [ ] Got Firebase config object from Project Settings

## Configure Application

- [ ] Opened `src/firebase.js` in a text editor
- [ ] Replaced placeholder config with my actual Firebase config
- [ ] Saved the file

## Run Locally

- [ ] Ran `npm install` (only needed once)
- [ ] Ran `npm run dev`
- [ ] Opened browser to `http://localhost:5173/ClinicalReviewScheduler/`
- [ ] Successfully logged in as supervisor

## Initial Data Setup

- [ ] Added all 19 entities in Entity Management
- [ ] Added all 20-25 employees in Employee Management
- [ ] Created first schedule and tested functionality

## Deploy to GitHub Pages

- [ ] Pushed code to GitHub (`git push origin main`)
- [ ] Enabled GitHub Pages in repository Settings > Pages
- [ ] Selected "GitHub Actions" as source
- [ ] Waited for deployment to complete
- [ ] Visited my live site at: `https://YOUR_USERNAME.github.io/ClinicalReviewScheduler/`

## Done!

Once all items are checked, your app is fully deployed and ready to use.

## Quick Reference

**Local Development:**
```bash
npm run dev
```

**Build for Production:**
```bash
npm run build
```

**Deploy to GitHub Pages:**
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

**Supervisor Login:**
- Email: supervisor@clinical.com
- Password: 1234

**Public Schedule View:**
- No login required
- Just visit the app URL
