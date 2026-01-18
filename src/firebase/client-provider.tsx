'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { auth, isUserLoading, user } = useFirebase();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // This effect runs once on mount to ensure anonymous sign-in
    const ensureAuth = async () => {
      if (!isUserLoading && !user && auth && !isSigningIn) {
        setIsSigningIn(true);
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged in the provider will handle setting the user
        } catch (error: any) {
          console.error("Anonymous sign-in failed:", error);
          setAuthError(`Could not connect to authentication service. Please refresh the page. (Error: ${error.code})`);
        } finally {
          setIsSigningIn(false);
        }
      }
    };
    ensureAuth();
  }, [isUserLoading, user, auth, isSigningIn]);
  
  // Combine loading states: initial auth state check and our explicit sign-in attempt
  const isLoading = isUserLoading || isSigningIn;

  if (authError) {
     return (
      <div className="flex h-screen items-center justify-center text-center p-4">
        <div>
            <h2 className="text-xl font-semibold text-destructive mb-2">Authentication Failed</h2>
            <p className="text-muted-foreground">{authError}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If we are not loading and have a user, we can render the children
  if (user) {
    return <>{children}</>;
  }

  // If not loading and still no user, something is wrong, but we have no specific error.
  // This case should ideally not be reached if the logic is correct.
  return (
      <div className="flex h-screen items-center justify-center">
        <p>Unable to authenticate. Please refresh the page.</p>
      </div>
  );
}


interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
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
