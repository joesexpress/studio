import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the main records page since there's no login.
  redirect('/records');
}
