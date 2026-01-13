'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(password: string) {
  if (password === 'kdhvac') {
    const cookieStore = cookies();
    cookieStore.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // One week
      path: '/',
    });
    return { success: true };
  } else {
    return { success: false, error: 'Incorrect password.' };
  }
}

export async function logout() {
    const cookieStore = cookies();
    cookieStore.delete('auth');
    redirect('/login');
}
