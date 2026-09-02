'use client';

import { useState, Suspense } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Better Auth expects 'token' in the query param or it automatically reads it from URL if we don't pass it, 
  // but we can just call resetPassword({ newPassword }). By default, it reads the 'token' param.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    setStatus('loading');
    
    // @ts-ignore
    const { error } = await authClient.resetPassword({
      newPassword: password,
    });

    if (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to reset password. The link might be expired.');
    } else {
      setStatus('success');
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Create New Password</h1>
      
      {status === 'success' ? (
        <div className="text-center p-4 bg-green-50 text-green-800 rounded-md">
          {message}
        </div>
      ) : (
        <>
          {status === 'error' && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {status === 'loading' ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
