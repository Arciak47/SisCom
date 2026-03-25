import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCIdbcxjtMwXO-y6AeEJmm6lkG9dHpfi8I",
  authDomain: "siscom-54722.firebaseapp.com",
  projectId: "siscom-54722",
  storageBucket: "siscom-54722.firebasestorage.app",
  messagingSenderId: "544702602482",
  appId: "1:544702602482:web:758e4ea8d71483b2ba446b",
  measurementId: "G-FF1MZ5BBXW"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);