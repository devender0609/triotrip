'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working');
  const [message, setMessage] = useState<string>('Finishing sign-in…');

  useEffect(() => {
    async function run() {
      try {
        // If the IdP sent an error, surface it (helps debug “Network error” screens)
        const url = new URL(window.location.href);
        const err = url.searchParams.get('error');
        const errDesc = url.searchParams.get('error_description');
        if (err) {
          throw new Error(`${err}: ${errDesc || 'OAuth error'}`);
        }

        // Exchange PKCE code for a Supabase session (sets cookies)
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;

        setStatus('ok');
        setMessage('Signed in. Redirecting…');

        // Allow a tick for cookie write, then go home
        setTimeout(() => router.replace('/'), 300);
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || 'Could not complete sign-in.');
      }
    }
    run();
  }, [router]);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-xl font-semibold mb-4">Auth</h1>
      <p className={status === 'error' ? 'text-rose-600' : 'text-slate-600'}>{message}</p>
    </div>
  );
}
