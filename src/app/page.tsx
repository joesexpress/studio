import { redirect } from 'next/navigation';

export default function Home() {
  // The middleware will handle redirection to /records.
  redirect('/records');
}
