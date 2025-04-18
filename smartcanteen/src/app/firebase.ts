// firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {

    apiKey: "AIzaSyAhyx2i4X9oFwGuMN4ITos5y_TesmV3ino",
  
    authDomain: "smartcanteen-28b15.firebaseapp.com",
  
    projectId: "smartcanteen-28b15",
  storageBucket: "smartcanteen-28b15.firebasestorage.app",
    messagingSenderId: "495433347452",
    appId: "1:495433347452:web:a408c4c20105bca534b4f9",
    measurementId: "G-1N84ZGN10G"
  
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore instance
const db = getFirestore(app);

export { db };
