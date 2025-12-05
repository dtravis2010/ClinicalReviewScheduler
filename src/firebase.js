import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYTMk7hB96D3PlSDjK0SUlK6hTS0EgqPo",
  authDomain: "clinicalreviewscheduler.firebaseapp.com",
  projectId: "clinicalreviewscheduler",
  storageBucket: "clinicalreviewscheduler.firebasestorage.app",
  messagingSenderId: "367634726664",
  appId: "1:367634726664:web:3e2c1b5bbf06d0c289b6bd",
  measurementId: "G-FPPY02D8YV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
