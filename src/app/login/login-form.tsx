'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FirebaseClientProvider, useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { onAuthStateChanged, User, sendPasswordResetEmail } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function AuthWrapper({ children }: { children: React.ReactNode }) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}

function LoginFormContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const { auth } = useFirebase();

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsUserLoading(false);
      if (user) {
        router.push('/records');
      }
    });
    return () => unsubscribe();
  }, [auth, router]);
  
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
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Sign In Successful!',
        description: "You're now logged in.",
      });
      // onAuthStateChanged will handle the redirect
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user doesn't exist, create a new account
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          toast({
            title: 'Account Created!',
            description: 'Welcome! Your new account has been created.',
          });
        } catch (createError: any) {
          toast({
            title: 'Account Creation Failed',
            description: createError.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
        }
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast({
            title: 'Sign In Failed',
            description: 'The password you entered is incorrect. Please try again or use "Forgot Password?".',
            variant: 'destructive',
        });
      } else {
        toast({
            title: 'Sign In Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
      }
    } finally {
        setIsSigningIn(false);
    }
  };

  const handleGuestSignIn = () => {
    setEmail('guest@kdhvac.com');
    setPassword('');
    toast({
        title: 'Guest Login',
        description: 'The password is "kdhvac".',
    });
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({
            title: 'Email Required',
            description: 'Please enter your email address.',
            variant: 'destructive',
        });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: 'Password Reset Email Sent',
            description: `If an account exists for ${resetEmail}, a password reset link has been sent.`,
        });
    } catch (error: any) {
        toast({
            title: 'Error Sending Reset Email',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
    }
  }

  const isLoading = isSigningIn || isUserLoading;

  if (isUserLoading || user) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
  }

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
                    onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                    disabled={isLoading}
                    placeholder="kdhvac"
                />
            </div>
          <Button onClick={handleSignIn} className="w-full" disabled={isLoading}>
            {isSigningIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              'Sign In or Create Account'
            )}
          </Button>
          <Button variant="secondary" onClick={handleGuestSignIn} className="w-full" disabled={isLoading}>
            Enter as Guest
          </Button>
            <div className="text-center text-sm">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto">Forgot Password?</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter your email address below and we'll send you a link to reset your password.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                                id="reset-email"
                                type="email"
                                placeholder="you@example.com"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                            />
                        </div>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePasswordReset}>Send Reset Link</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
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
