'use client';

import { useCallback, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabaseClient';

export const revalidate = 0;               // ✅ valid
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const supabase = getBrowserSupabase();
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : '/auth/callback';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) setErr(error.message);
    } catch (e: any) {
      setErr(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow">
        <div className="p-6">
          <h1 className="text-lg font-semibold mb-2">Welcome back</h1>
          <p className="text-xs text-gray-500 mb-4">
            Sign in to save trips and sync across devices.
          </p>
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full rounded-md px-3 py-2 text-sm font-medium bg-black text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>
          {err ? <p className="mt-3 text-xs text-red-600">{err}</p> : null}
        </div>
      </div>
    </div>
  );
}
