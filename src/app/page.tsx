import { redirect } from 'next/navigation';

export default function Home() {
  // Always redirect to the app, middleware will handle auth check.
  redirect('/records');
}
