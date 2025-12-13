// Production build
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDEU3rkBMSZjanP7MRpAxa5NJ_ZZIjjyEM",
    authDomain: "pts-b04bb.firebaseapp.com",
    projectId: "pts-b04bb",
    storageBucket: "pts-b04bb.firebasestorage.app",
    messagingSenderId: "735039157918",
    appId: "1:735039157918:web:8ada560a693ba7777ded8f",
    measurementId: "G-2W3VLM7782"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
