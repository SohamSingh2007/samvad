'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/health`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (data.status === 'ok' && data.db === 'connected') {
          setHealthStatus('connected');
        } else {
          setHealthStatus('error');
        }
      } catch {
        setHealthStatus('error');
      }
    };

    checkHealth();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">AI-Powered Meeting App</h1>
      <div className="text-2xl">
        {healthStatus === 'loading' && <span>Checking backend connection... ⏳</span>}
        {healthStatus === 'connected' && <span className="text-green-500">Backend connected ✅</span>}
        {healthStatus === 'error' && <span className="text-red-500">Backend unreachable ❌</span>}
      </div>
    </main>
  );
}
