'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabaseClient';

// ✅ VALID: must be a number or false (NOT an object)
export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function CallbackInner() {
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const code = sp.get('code');
        if (!code) {
          router.replace('/login?error=missing_code');
          return;
        }
        const supabase = getBrowserSupabase();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        router.replace('/'); // go home (or /account)
      } catch (e: any) {
        router.replace(`/login?error=${encodeURIComponent(e?.message ?? 'callback_failed')}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="p-6 text-sm">Signing you in…</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
