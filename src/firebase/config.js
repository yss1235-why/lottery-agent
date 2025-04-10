// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCG9FYiBcL3XCaF9_JNLcsVAFyjdRWq5g4",
  authDomain: "lottery-85f3f.firebaseapp.com",
  databaseURL: "https://lottery-85f3f-default-rtdb.firebaseio.com",
  projectId: "lottery-85f3f",
  storageBucket: "lottery-85f3f.firebasestorage.app",
  messagingSenderId: "1037764284568",
  appId: "1:1037764284568:web:98bde5d514183fd0c500ed",
  measurementId: "G-E0LCNTMCZT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

export { app, auth, database, storage };