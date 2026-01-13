import LoginForm from './login-form';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
       <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <Image
                src="https://storage.googleapis.com/project-os-prod-public/a6198642-8872-4665-9114-15c99d21d51a.png"
                alt="K & D Refrigeration & Heating"
                width={240}
                height={67}
                unoptimized
            />
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
