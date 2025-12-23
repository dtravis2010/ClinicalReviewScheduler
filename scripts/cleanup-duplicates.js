/**
 * Cleanup duplicate/wrong employees
 * 
 * Run with: node scripts/cleanup-duplicates.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// These are the CORRECT employees to KEEP (based on user's current employee list)
const EMPLOYEES_TO_KEEP = [
  'Alyssa Norton',
  'Casey Whipple', 
  'Chasity Harvey',
  'Erika Cuellar',
  'Gayla McDonald',
  'Jacque Clark',
  'Linh Nguyen',
  'Maria Castillo',
  'Nachole Reed',
  'Raquel De La Rosa',
  'Sheila Perez',
  'Stephanie Pham',
  'Trish Morin',
  'Venus Cross',
  'Brianna Paredes',
  'Dominique Seals',
  'Maria Lopez Galindo',
  'Raven Sublett',
  'Jordan Turner',
  // Also keep Maria Lopez if it's different from Maria Lopez Galindo
  'Maria Lopez',
];

async function main() {
  console.log('🧹 Cleaning up duplicate/incorrect employees...\n');
  
  const employeesRef = collection(db, 'employees');
  const snapshot = await getDocs(employeesRef);
  
  let deleteCount = 0;
  let keepCount = 0;
  const toDelete = [];
  const toKeep = [];
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.name || 'Unknown';
    
    if (EMPLOYEES_TO_KEEP.includes(name)) {
      toKeep.push({ id: docSnap.id, name });
      keepCount++;
    } else {
      toDelete.push({ id: docSnap.id, name });
    }
  }
  
  console.log('✅ Employees to KEEP:');
  toKeep.forEach(e => console.log(`   - ${e.name} (${e.id})`));
  
  console.log('\n❌ Employees to DELETE:');
  toDelete.forEach(e => console.log(`   - ${e.name} (${e.id})`));
  
  console.log(`\n📊 Summary: Keep ${toKeep.length}, Delete ${toDelete.length}`);
  console.log('\n🔥 Deleting...\n');
  
  for (const emp of toDelete) {
    await deleteDoc(doc(db, 'employees', emp.id));
    console.log(`   Deleted: ${emp.name}`);
    deleteCount++;
  }
  
  console.log(`\n✅ Done! Deleted ${deleteCount} employees.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
