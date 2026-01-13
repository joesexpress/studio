import { redirect } from 'next/navigation';

export default function Home() {
  // The middleware will handle redirection to /login or /records.
  // This component will likely not be rendered directly.
  redirect('/login');
}
