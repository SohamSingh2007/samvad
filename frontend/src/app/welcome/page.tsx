import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from './logout-button';

export default async function WelcomePage() {
  // Check session on the server
  // Note: in Next.js 15+, headers() is async
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4">
          Welcome, {session.user.name}!
        </h1>
        
        <p className="text-gray-600 mb-8">
          You are successfully logged in as a <strong>{session.user.role === 'speechless_user' ? 'Speechless User' : 'General User'}</strong>.
        </p>

        <LogoutButton />
      </div>
    </div>
  );
}
