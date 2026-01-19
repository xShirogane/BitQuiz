// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
// UWAGA: Zmieniamy import z 'getAuth' na te poniżej:
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Twój config (zostaw swój!)
const firebaseConfig = {
  apiKey: "AIzaSyCQn9kH54O-WFaHNAOwZCDavxxyT8hLB-o",
  authDomain: "bitquiz-app.firebaseapp.com",
  projectId: "bitquiz-app",
  storageBucket: "bitquiz-app.firebasestorage.app",
  messagingSenderId: "453113211026",
  appId: "1:453113211026:web:4185e2fb75f131e1ed1e4b"
};

const app = initializeApp(firebaseConfig);

// ZMIANA: Inicjalizujemy Auth z persystencją (pamięcią)
// Dzięki temu użytkownik nie zostanie wylogowany po zamknięciu apki
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);