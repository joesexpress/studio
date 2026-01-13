'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useFirebase } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import Cookies from 'js-cookie';

function AuthHandler({ children }: { children: ReactNode }) {
  const { user } = useFirebase();

  useEffect(() => {
    // This effect now manages a cookie based on the user's authentication state.
    // The middleware uses this cookie to protect routes.
    if (user) {
      // User is logged in, set a cookie.
      // You might want to use the user's ID token for a more secure approach.
      Cookies.set('userToken', 'true', { expires: 1 }); // Expires in 1 day
    } else {
      // User is logged out, remove the cookie.
      Cookies.remove('userToken');
    }
  }, [user]);

  return <>{children}</>;
}


interface FirebaseClientProviderProps {
  children: React.Node;
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
