// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, getDoc, setDoc, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// YOUR FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCZ0j398VfiI0rrXf5VyQ6qUr4iKFBPW4s",
  authDomain: "abqar-store.firebaseapp.com",
  projectId: "abqar-store",
  storageBucket: "abqar-store.firebasestorage.app",
  messagingSenderId: "119184115173",
  appId: "1:119184115173:web:46d08d93578b02970e1b0c",
  measurementId: "G-LFF1FP9YNH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const salesCollection = collection(db, 'sales');
const customersCollection = collection(db, 'customers');

export {
  db,
  auth,
  salesCollection,
  customersCollection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc,
  query,
  onAuthStateChanged,
  signInAnonymously
};
