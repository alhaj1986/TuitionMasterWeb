import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAhvoYTh67Hj1C44jc7ETsJ3O80j1R2mbw",
  authDomain: "jujutution-c93bc.firebaseapp.com",
  projectId: "jujutution-c93bc",
  storageBucket: "jujutution-c93bc.firebasestorage.app",
  messagingSenderId: "304590449403",
  appId: "1:304590449403:web:89a5d482b854cbe8c75e5e",
  measurementId: "G-T5MS0VW6FZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
