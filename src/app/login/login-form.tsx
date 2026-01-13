'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FirebaseClientProvider, useFirebase, useUser } from '@/firebase';
import { initiateAnonymousSignIn, initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}

function LoginFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (!email || !password) {
        toast({
            title: 'Missing Fields',
            description: 'Please enter both email and password.',
            variant: 'destructive'
        });
        setIsSigningIn(false);
        return;
    }

    try {
      initiateEmailSignIn(auth, email, password);
      toast({
        title: 'Signing In...',
        description: 'Please wait while we sign you in.',
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

  const handleGuestSignIn = async () => {
    setIsSigningIn(true);
    try {
        initiateEmailSignIn(auth, 'guest@kdhvac.com', 'kdhvac');
        toast({
            title: 'Signing In as Guest...',
            description: 'You are being signed in as a guest.',
        });
    } catch (error: any) {
        toast({
            title: 'Sign In Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
        setIsSigningIn(false);
    }
  }

  const isLoading = isSigningIn || isUserLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to K & D</CardTitle>
        <CardDescription>Enter your credentials to access the portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="derek@kdhvac.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                />
            </div>
          <Button onClick={handleSignIn} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          <Button variant="secondary" onClick={handleGuestSignIn} className="w-full" disabled={isLoading}>
            Enter as Guest
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
