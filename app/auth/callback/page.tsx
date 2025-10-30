'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabaseClient';

// prevent prerender & caching (fixes Vercel error)
export const dynamic = 'force-dynamic';
export const revalidate = false;

export default function AuthCallback() {
  const router = useRouter();
  const qp = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = getBrowserSupabase();

      // If coming back from Google, exchange the code for a session
      const url = new URL(window.location.href);
      const hasCode = url.searchParams.get('code');

      if (hasCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(url.href);
        if (error) {
          // go back to login with a friendly message
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      }

      // optional: support redirect back to where the user started
      const next = qp.get('next') || '/';
      router.replace(next);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Signing you in…</h2>
      <p>You’ll be redirected in a moment.</p>
    </div>
  );
}
