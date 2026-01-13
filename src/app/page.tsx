import { redirect } from 'next/navigation';

export default function Home() {
  // The middleware will handle redirection to /login or /records.
  // This page can remain as a simple entry point.
  redirect('/login');
}
