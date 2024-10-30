import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const apps = getApps();

const firebaseAdmin = apps.length === 0 
  ? initializeApp({
      credential: cert({
        projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: import.meta.env.PUBLIC_FIREBASE_CLIENT_EMAIL,
        privateKey: import.meta.env.PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  : apps[0];

export const adminAuth = getAuth(firebaseAdmin);