'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || !email) return;

    setStatus('loading');
    
    // @ts-ignore
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/welcome',
    });

    if (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to resend email');
    } else {
      setStatus('success');
      setMessage('Verification email sent! Please check your inbox.');
      
      // Rate limiting: 60 seconds
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Verify your Email</h1>
        
        <p className="text-gray-600 mb-6">
          We've sent a verification link to your email address. Please click the link to activate your account.
        </p>

        <div className="mb-6 p-4 bg-blue-50 rounded-md text-sm text-blue-800 text-left">
          <strong>Didn't receive it?</strong> Enter your email below to resend the link.
        </div>

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading' || cooldown > 0 || !email}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {status === 'loading' ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm ${status === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="mt-6">
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
