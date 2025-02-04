// Import necessary Firebase functions
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJjapbOMzv884_XBXPU5uJCU0N_bGKFUE",
  authDomain: "seniordesign-8e264.firebaseapp.com",
  projectId: "seniordesign-8e264",
  storageBucket: "seniordesign-8e264.appspot.com",  
  messagingSenderId: "731817938434",
  appId: "1:731817938434:web:84e3b8c15f25e01cb2a11b",
  measurementId: "G-QHF4ERZ7BW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (for database operations)
const db = getFirestore(app);

// Initialize Analytics (optional, for tracking)
const analytics = getAnalytics(app);

// Export instances for use in components
export { db, analytics };

