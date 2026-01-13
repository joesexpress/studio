'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, initiateAnonymousSignIn, useFirebase } from '@/firebase';

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { auth, isUserLoading, user, isAuthReady } = useFirebase();

  useEffect(() => {
    // This effect ensures that if we are past the initial user loading phase
    // and there is still no user, we initiate the anonymous sign in.
    // The onAuthStateChanged listener in the provider will then pick up the new user.
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  // Render children only when auth state is fully resolved.
  if (!isAuthReady) {
    return null; // Or a global loading spinner
  }

  return <>{children}</>;
}


interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {

  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      <AuthHandler>
        {children}
      </AuthHandler>
    </FirebaseProvider>
  );
}
