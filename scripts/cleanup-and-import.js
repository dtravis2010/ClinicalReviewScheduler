/**
 * Cleanup old data and import new schedules
 * 
 * This script:
 * 1. Deletes all schedules before 2023
 * 2. Deletes archived employees
 * 3. Imports 2023+ schedules from cr_schedule_data.json
 * 4. Creates/updates employees from the JSON file
 * 
 * Run with: node scripts/cleanup-and-import.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Firebase config from environment
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuration
const CUTOFF_YEAR = 2023;
const DRY_RUN = false; // Set to true to preview changes without deleting

async function main() {
  console.log('🔥 Firebase Cleanup and Import Script');
  console.log('=====================================\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Step 1: Delete old schedules
  await deleteOldSchedules();
  
  // Step 2: Delete archived employees
  await deleteArchivedEmployees();
  
  // Step 3: Import new data
  await importNewData();
  
  console.log('\n✅ Script completed!');
  process.exit(0);
}

async function deleteOldSchedules() {
  console.log(`📅 Step 1: Deleting schedules before ${CUTOFF_YEAR}...`);
  
  const schedulesRef = collection(db, 'schedules');
  const snapshot = await getDocs(schedulesRef);
  
  let deleteCount = 0;
  let keepCount = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const startDate = data.startDate || docSnap.id.split('_')[0];
    const year = parseInt(startDate.split('-')[0], 10);
    
    if (year < CUTOFF_YEAR) {
      console.log(`  ❌ Deleting: ${docSnap.id} (${data.name || 'unnamed'})`);
      if (!DRY_RUN) {
        await deleteDoc(doc(db, 'schedules', docSnap.id));
      }
      deleteCount++;
    } else {
      console.log(`  ✓ Keeping: ${docSnap.id} (${data.name || 'unnamed'})`);
      keepCount++;
    }
  }
  
  console.log(`\n  Deleted: ${deleteCount} schedules`);
  console.log(`  Kept: ${keepCount} schedules\n`);
}

async function deleteArchivedEmployees() {
  console.log('👤 Step 2: Deleting archived employees...');
  
  const employeesRef = collection(db, 'employees');
  const snapshot = await getDocs(employeesRef);
  
  let deleteCount = 0;
  let keepCount = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    if (data.archived === true) {
      console.log(`  ❌ Deleting: ${data.name || docSnap.id} (archived)`);
      if (!DRY_RUN) {
        await deleteDoc(doc(db, 'employees', docSnap.id));
      }
      deleteCount++;
    } else {
      console.log(`  ✓ Keeping: ${data.name || docSnap.id}`);
      keepCount++;
    }
  }
  
  console.log(`\n  Deleted: ${deleteCount} archived employees`);
  console.log(`  Kept: ${keepCount} active employees\n`);
}

async function importNewData() {
  console.log('📥 Step 3: Importing new data from cr_schedule_data.json...');
  
  // Load the JSON file
  const jsonPath = join(__dirname, '..', 'cr_schedule_data.json');
  let data;
  try {
    const fileContent = readFileSync(jsonPath, 'utf-8');
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error(`  ❌ Error reading JSON file: ${error.message}`);
    return;
  }
  
  // Get existing employees to create name -> ID mapping
  const existingEmployees = await getExistingEmployees();
  console.log(`  Found ${Object.keys(existingEmployees).length} existing employees in database\n`);
  
  // Import employees first (to get IDs for schedule assignments)
  const employeeIdMap = await importEmployees(data.employees, existingEmployees);
  
  // Import schedules (only 2023+)
  await importSchedules(data.schedules, employeeIdMap);
}

async function getExistingEmployees() {
  const employeesRef = collection(db, 'employees');
  const snapshot = await getDocs(employeesRef);
  
  const employees = {};
  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    if (data.name) {
      // Create lookup by normalized name
      const normalizedName = data.name.toLowerCase().trim();
      employees[normalizedName] = {
        id: docSnap.id,
        ...data
      };
    }
  });
  
  return employees;
}

async function importEmployees(employees, existingEmployees) {
  console.log('  👥 Importing employees...');
  
  const employeeIdMap = {}; // name -> firestoreId
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const emp of employees) {
    // Skip archived employees from import
    if (emp.archived) {
      skippedCount++;
      continue;
    }
    
    const normalizedName = emp.name.toLowerCase().trim();
    const existing = existingEmployees[normalizedName];
    
    if (existing) {
      // Employee exists - use existing ID
      employeeIdMap[emp.name] = existing.id;
      
      // Optionally update skills if they've changed
      const newSkills = emp.skills || [];
      const existingSkills = existing.skills || [];
      const hasNewSkills = newSkills.some(s => !existingSkills.includes(s));
      
      if (hasNewSkills && !DRY_RUN) {
        const mergedSkills = [...new Set([...existingSkills, ...newSkills])];
        await setDoc(doc(db, 'employees', existing.id), {
          ...existing,
          skills: mergedSkills
        }, { merge: true });
        updatedCount++;
        console.log(`    ✏️  Updated skills for: ${emp.name}`);
      }
    } else {
      // Create new employee
      const newDocRef = doc(collection(db, 'employees'));
      employeeIdMap[emp.name] = newDocRef.id;
      
      if (!DRY_RUN) {
        await setDoc(newDocRef, {
          name: emp.name,
          email: '',
          skills: emp.skills || [],
          archived: false,
          notes: emp.notes || '',
          position: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      createdCount++;
      console.log(`    ➕ Created: ${emp.name}`);
    }
  }
  
  console.log(`\n    Created: ${createdCount} new employees`);
  console.log(`    Updated: ${updatedCount} existing employees`);
  console.log(`    Skipped: ${skippedCount} archived employees\n`);
  
  return employeeIdMap;
}

async function importSchedules(schedules, employeeIdMap) {
  console.log('  📅 Importing schedules (2023+ only)...');
  
  let importedCount = 0;
  let skippedCount = 0;
  let existsCount = 0;
  
  for (const schedule of schedules) {
    const year = parseInt(schedule.startDate.split('-')[0], 10);
    
    // Skip schedules before cutoff year
    if (year < CUTOFF_YEAR) {
      skippedCount++;
      continue;
    }
    
    // Check if schedule already exists
    const existingDoc = await getDoc(doc(db, 'schedules', schedule.id));
    if (existingDoc.exists()) {
      console.log(`    ⏭️  Already exists: ${schedule.id}`);
      existsCount++;
      continue;
    }
    
    // Convert employee names to IDs in assignments
    const convertedAssignments = {};
    for (const [employeeName, assignment] of Object.entries(schedule.assignments)) {
      const employeeId = employeeIdMap[employeeName];
      if (employeeId) {
        convertedAssignments[employeeId] = assignment;
      } else {
        console.log(`    ⚠️  Unknown employee: ${employeeName} - skipping assignment`);
      }
    }
    
    // Create the schedule document
    const scheduleData = {
      name: schedule.name,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      status: schedule.status || 'published',
      darCount: schedule.darCount || 6,
      darEntities: schedule.darEntities || {},
      assignments: convertedAssignments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };
    
    if (!DRY_RUN) {
      await setDoc(doc(db, 'schedules', schedule.id), scheduleData);
    }
    
    console.log(`    ✅ Imported: ${schedule.id} (${schedule.name})`);
    importedCount++;
  }
  
  console.log(`\n    Imported: ${importedCount} schedules`);
  console.log(`    Already existed: ${existsCount} schedules`);
  console.log(`    Skipped (pre-${CUTOFF_YEAR}): ${skippedCount} schedules\n`);
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
