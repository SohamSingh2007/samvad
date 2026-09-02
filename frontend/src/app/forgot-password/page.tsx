'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    // Using Better Auth's forgetPassword
    // @ts-ignore - forgetPassword is not inferred correctly without typeof auth on client
    const { error } = await authClient.forgetPassword({
      email,
      redirectTo: '/reset-password', // Where the email link will point
    });

    if (error) {
      setStatus('error');
      setMessage(error.message || 'An error occurred');
    } else {
      setStatus('success');
      // For security hygiene, we always show success even if the email doesn't exist
      setMessage('If an account exists with this email, a password reset link has been sent.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>
        
        {status === 'success' ? (
          <div className="text-center">
            <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-md">
              {message}
            </div>
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {status === 'error' && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-500">
                Cancel
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
