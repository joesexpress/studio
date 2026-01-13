'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FirebaseClientProvider, useFirebase, useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}

function LoginFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { auth } = useFirebase();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // If user is logged in, redirect them.
    if (user) {
      router.push('/records');
    }
  }, [user, router]);
  
  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      initiateAnonymousSignIn(auth);
      toast({
        title: 'Signing In...',
        description: 'You are being signed in as a guest.',
      });
      // The onAuthStateChanged listener will handle the redirect.
    } catch (error: any) {
      toast({
        title: 'Sign In Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setIsSigningIn(false);
    }
  };

  const isLoading = isSigningIn || isUserLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to K & D</CardTitle>
        <CardDescription>Click the button below to sign in as a guest.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={handleSignIn} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              'Enter as Guest'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginForm() {
    return (
        <AuthWrapper>
            <LoginFormContent />
        </AuthWrapper>
    )
}
