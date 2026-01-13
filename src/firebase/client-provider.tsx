'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useFirebase } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

function AuthHandler({ children }: { children: ReactNode }) {
  const { auth, user, isUserLoading } = useFirebase();

  useEffect(() => {
    if (!isUserLoading && !user) {
      // Automatically sign in the guest user if no one is logged in
      signInWithEmailAndPassword(auth, 'guest@kdhvac.com', 'password').catch(error => {
        if (error.code === 'auth/user-not-found') {
          // If guest user doesn't exist, create it
          const { createUserWithEmailAndPassword } = require('firebase/auth');
          createUserWithEmailAndPassword(auth, 'guest@kdhvac.com', 'password').catch(console.error);
        }
      });
    }
  }, [auth, user, isUserLoading]);

  return <>{children}</>;
}


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      <AuthHandler>{children}</AuthHandler>
    </FirebaseProvider>
  );
}
