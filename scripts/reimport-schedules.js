import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import 'dotenv/config';

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
});

const db = getFirestore(app);

// Current employees - map first name to ID
const EMPLOYEE_MAP = {
  'Sheila': { id: '03J5agdwNXTLm5Ux9cPx', name: 'Sheila Perez' },
  'Alyssa': { id: '1bduBEVE7kMdCubJkWVN', name: 'Alyssa Norton' },
  'Maria C': { id: 'IYs57Dsh8dbbiuFtZe17', name: 'Maria Castillo' },
  'Jordan': { id: 'IoiE3xFkSRlb94iOnl1S', name: 'Jordan Turner' },
  'Erika': { id: 'IqbDpish5c7Fgj44Csc0', name: 'Erika Cuellar' },
  'Gayla': { id: 'LKIxbhwoyDWfv1DDJLDY', name: 'Gayla McDonald' },
  'Maria L': { id: 'O3LZRwKaHltv64EsgeX3', name: 'Maria Lopez Galindo' },
  'Nachole': { id: 'PKgqUWePxShlcuMIbPXk', name: 'Nachole Reed' },
  'Stephanie': { id: 'Sast5awFFz8fMLJE9tLU', name: 'Stephanie Pham' },
  'Chasity': { id: 'VZCUasHN7Kl37jIoo5Pl', name: 'Chasity Harvey' },
  'Dominique': { id: 'YAR3OJskunj0MxvEhUWp', name: 'Dominique Seals' },
  'Venus': { id: 'YnjIh56FE71EEfINOxI2', name: 'Venus Cross' },
  'Raquel': { id: 'cMD33rdr00idmXYMcbrF', name: 'Raquel De La Rosa' },
  'Trish': { id: 'drTDbVBLNAoCqT52u6at', name: 'Trish Morin' },
  'Jacque': { id: 'i15q1F7nebCfAXbCNjHQ', name: 'Jacque Clark' },
  'Brianna': { id: 'i9itFZNyfgS7mjeqmTtq', name: 'Brianna Paredes' },
  'Casey': { id: 'sy0ft9gB6rp85tKUcrNH', name: 'Casey Whipple' },
  'Raven': { id: 'w9ufVlcVmBICrVQwdW6g', name: 'Raven Sublett' },
  'Linh': { id: 'yV1vNPUeIDhBUS6Cri0i', name: 'Linh Nguyen' },
};

// Map JSON name to employee ID
function getEmployeeId(jsonName) {
  const firstName = jsonName.split(' ')[0];
  
  // Handle Maria disambiguation
  if (firstName === 'Maria') {
    if (jsonName.includes('Lopez') || jsonName.includes('Galindo')) {
      return EMPLOYEE_MAP['Maria L']?.id;
    }
    // Default to Maria Castillo for other Marias
    return EMPLOYEE_MAP['Maria C']?.id;
  }
  
  const emp = EMPLOYEE_MAP[firstName];
  return emp?.id || null;
}

// Entity code to full name mapping
const ENTITY_CODE_MAP = {
  'THA': 'Texas Health Allen',
  'THAL': 'Texas Health Allen',
  'THB': 'Texas Health Burleson',
  'THC': 'Texas Health Cleburn',
  'THD': 'Texas Health Dallas',
  'THDN': 'Texas Health Denton',
  'THFM': 'Texas Health Flowermound',
  'THFW': 'Texas Health Fort Worth',
  'THF': 'Texas Health Frisco',
  'THH': 'Texas Health HEB',
  'HEB': 'Texas Health HEB',
  'THK': 'Texas Health Kaufman',
  'THP': 'Texas Health Plano',
  'THPS': 'Texas Health Prosper',
  'THPR': 'Texas Health Prosper',
  'THR': 'Texas Health Rockwall',
  'THRW': 'Texas Health Rockwall',
  'RW': 'Texas Health Rockwall',
  'SW': 'Texas Health Southwest',
  'THSW': 'Texas Health Southwest',
  'THS': 'Texas Health Stephenville',
  'THWP': 'Texas Health Willow Park',
  'THAM': 'Texas Health Arlington Memorial',
  'AM': 'Texas Health Arlington Memorial',
  'AMH': 'Texas Health Arlington Memorial',
  'THAZ': 'Texas Health Azle',
  'THALL': 'Texas Health Alliance',
  'DN': 'Texas Health Denton',
};

// Convert entity code string like "THC/THAL/THB" to array of full names
function convertEntityString(entityStr) {
  if (!entityStr || typeof entityStr !== 'string') return [];
  if (entityStr.trim() === '') return [];
  
  const codes = entityStr.split('/').map(c => c.trim()).filter(c => c);
  const fullNames = codes.map(code => ENTITY_CODE_MAP[code.toUpperCase()] || code);
  return fullNames;
}

async function main() {
  console.log('📅 Re-importing schedules with correct employee mappings...\n');

  // Load JSON data
  const data = JSON.parse(fs.readFileSync('cr_schedule_data.json', 'utf8'));
  
  // Filter to 2023+ schedules
  const schedules2023Plus = data.schedules.filter(s => {
    const year = parseInt(s.id.split('-')[0]);
    return year >= 2023;
  });

  // Sort chronologically
  schedules2023Plus.sort((a, b) => a.id.localeCompare(b.id));

  console.log(`Found ${schedules2023Plus.length} schedules to import (2023+):\n`);

  // Step 1: Delete existing schedules (2023+ only)
  console.log('🗑️  Deleting existing schedules...');
  const existingSnap = await getDocs(collection(db, 'schedules'));
  let deleted = 0;
  for (const docSnap of existingSnap.docs) {
    const id = docSnap.id;
    // Only delete date-based schedules from 2023+
    if (/^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/.test(id)) {
      const year = parseInt(id.split('-')[0]);
      if (year >= 2023) {
        await deleteDoc(doc(db, 'schedules', id));
        console.log(`   Deleted: ${id}`);
        deleted++;
      }
    }
  }
  console.log(`   Deleted ${deleted} schedules\n`);

  // Step 2: Import schedules with correct employee IDs
  console.log('📥 Importing schedules with correct employee mappings...\n');
  
  let imported = 0;
  let unmappedEmployees = new Set();

  for (const schedule of schedules2023Plus) {
    // Convert assignments from name-keyed to ID-keyed
    const newAssignments = {};
    let assignmentCount = 0;
    
    for (const [name, assignment] of Object.entries(schedule.assignments || {})) {
      const empId = getEmployeeId(name);
      if (empId) {
        // Convert assignment fields to expected format
        const convertedAssignment = {
          ...assignment,
          // Convert newIncomingItems string to newIncoming array
          // e.g., "THC/THAL/THB" -> ["Texas Health Cleburn", "Texas Health Allen", "Texas Health Burleson"]
          newIncoming: convertEntityString(assignment.newIncomingItems),
          // Convert crossTraining string to array if needed
          crossTraining: convertEntityString(assignment.crossTraining),
          // Keep dars as-is (they're indices)
          dars: assignment.dars || [],
          // Keep other fields
          cpoe: assignment.cpoe || '',
          backupNewIncoming: assignment.backupNewIncoming || false,
          specialProjects: assignment.specialProjects || { threePEmail: false, threePBackupEmail: false, float: false, notes: '' }
        };
        // Remove old field name
        delete convertedAssignment.newIncomingItems;
        
        newAssignments[empId] = convertedAssignment;
        assignmentCount++;
      } else {
        unmappedEmployees.add(name);
      }
    }

    // Create schedule document
    const scheduleDoc = {
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      assignments: newAssignments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Add sortOrder based on start date for chronological ordering
      sortOrder: new Date(schedule.startDate).getTime()
    };

    await setDoc(doc(db, 'schedules', schedule.id), scheduleDoc);
    console.log(`   ✅ ${schedule.id} (${assignmentCount} assignments)`);
    imported++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Imported ${imported} schedules`);
  console.log(`   - Schedules are now in chronological order`);
  
  if (unmappedEmployees.size > 0) {
    console.log(`\n⚠️  Unmapped employees (skipped):`);
    for (const name of unmappedEmployees) {
      console.log(`   - ${name}`);
    }
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

main().catch(console.error);
