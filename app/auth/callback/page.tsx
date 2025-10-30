'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabaseClient';

// IMPORTANT: valid values only — number or false
export const revalidate = 0;              // do not statically cache
export const dynamic = 'force-dynamic';   // always run on the server at request time
export const fetchCache = 'force-no-store';

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const code = searchParams.get('code');
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

        // ✅ Success — send user to home (or your dashboard)
        router.replace('/');
      } catch (e: any) {
        router.replace(`/login?error=${encodeURIComponent(e?.message ?? 'callback_failed')}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 text-sm">
      Signing you in… please wait.
    </div>
  );
}

export default function Page() {
  // Wrap the hook-using child with Suspense per Next.js requirement
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
