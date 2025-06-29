import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

let app: App | undefined;

// Provjeri da li su Firebase varijable postavljene
const hasFirebaseConfig = process.env.FIREBASE_PROJECT_ID && 
                         process.env.FIREBASE_PRIVATE_KEY && 
                         process.env.FIREBASE_CLIENT_EMAIL && 
                         process.env.FIREBASE_STORAGE_BUCKET;

if (!getApps().length && hasFirebaseConfig) {
  try {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin uspješno inicijalizovan');
  } catch (error) {
    console.error('Greška pri inicijalizaciji Firebase Admin:', error);
  }
} else if (getApps().length > 0) {
  app = getApps()[0];
  console.log('Firebase Admin već inicijalizovan');
} else {
  console.warn('Firebase Admin nije konfigurisan. Provjerite environment varijable: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_STORAGE_BUCKET');
}

export const firebaseApp = app;
export const firebaseStorage = app ? getStorage(app) : null; 