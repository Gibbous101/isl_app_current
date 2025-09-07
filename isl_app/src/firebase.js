import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDU8ilRZLNhIS58lKO8spFjTSldKarQJBw",
    authDomain: "isl-app-a2f16.firebaseapp.com",
    databaseURL: "https://isl-app-a2f16-default-rtdb.firebaseio.com",
    projectId: "isl-app-a2f16",
    storageBucket: "isl-app-a2f16.firebasestorage.app",
    messagingSenderId: "71702224746",
    appId: "1:71702224746:web:ece53fba3d43ffc9efcf13",
    measurementId: "G-WRB0B3YPNC"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);