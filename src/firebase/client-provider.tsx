'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider, useFirebase } from '@/firebase/provider';
import { initializeFirebase, initiateAnonymousSignIn } from '@/firebase';

function AuthHandler({ children, onAuthReady }: { children: ReactNode, onAuthReady: (isReady: boolean) => void }) {
  const { auth, user, isUserLoading } = useFirebase();

  useEffect(() => {
    // When the initial user check is complete, we know the auth state is resolved.
    if (!isUserLoading) {
      if (!user && auth) {
        // If no user, sign in anonymously. The onAuthStateChanged listener
        // in FirebaseProvider will pick up the new user state.
        initiateAnonymousSignIn(auth);
      } else {
        // If there's already a user (or no auth instance), auth is "ready".
        onAuthReady(true);
      }
    }
  }, [isUserLoading, user, auth, onAuthReady]);

  // When the user object becomes available after loading, it means auth is ready.
  useEffect(() => {
    if (user) {
      onAuthReady(true);
    }
  }, [user, onAuthReady]);

  return <>{children}</>;
}


interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isAuthReady, setIsAuthReady] = useState(false);

  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  const providerValue = useMemo(() => ({
    ...firebaseServices,
    isAuthReady
  }), [firebaseServices, isAuthReady]);

  return (
    <FirebaseProvider
      firebaseApp={providerValue.firebaseApp}
      auth={providerValue.auth}
      firestore={providerValue.firestore}
      storage={providerValue.storage}
      isAuthReady={isAuthReady}
    >
      <AuthHandler onAuthReady={setIsAuthReady}>
        {children}
      </AuthHandler>
    </FirebaseProvider>
  );
}
