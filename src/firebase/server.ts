
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

let firestore: Firestore | null = null;

/**
 * Initializes and returns a Firestore instance for server-side use.
 * It uses a singleton pattern to avoid re-initializing on every call.
 */
export function initializeFirebase(): { firestore: Firestore | null } {
  if (!firestore) {
    try {
      if (!getApps().length) {
        const firebaseApp = initializeApp(firebaseConfig);
        firestore = getFirestore(firebaseApp);
      } else {
        const firebaseApp = getApp();
        firestore = getFirestore(firebaseApp);
      }
    } catch (e) {
      console.error("Failed to initialize server-side Firebase:", e);
      // In a real-world scenario, you might want to handle this more gracefully.
    }
  }
  return { firestore };
}
