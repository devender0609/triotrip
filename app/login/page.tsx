'use client';

import React, { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const SITE_BASE_FALLBACK = typeof window !== 'undefined' ? window.location.origin : '';
const tidy = (s?: string | null) => (s || '').replace(/\/+$/, '');

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Build a reliable callback URL (must match Supabase & Google OAuth)
  const siteBase = useMemo(
    () => tidy(process.env.NEXT_PUBLIC_SITE_BASE) || tidy(SITE_BASE_FALLBACK),
    []
  );
  const callbackUrl = `${siteBase}/auth/callback`;

  async function signInWithGoogle() {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
      // Browser will redirect away.
    } catch (e: any) {
      setErr(e?.message || 'Unable to start Google sign-in.');
      setBusy(false);
    }
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl },
      });
      if (error) throw error;
      setMsg('Check your email for a magic link to sign in.');
    } catch (e: any) {
      setErr(e?.message || 'Unable to send magic link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Login</h1>

      <button
        onClick={signInWithGoogle}
        disabled={busy}
        className="w-full rounded-xl border px-4 py-3 font-medium hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? 'Starting…' : 'Sign in with Google'}
      </button>

      <div className="my-6 text-center text-sm text-slate-500">or</div>

      <form onSubmit={signInWithEmail} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-sky-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      {msg && <p className="mt-4 text-sm text-emerald-600">{msg}</p>}
      {err && <p className="mt-4 text-sm text-rose-600">{err}</p>}

      <p className="mt-6 text-xs text-slate-500">
        You’ll be redirected to <code className="rounded bg-slate-100 px-1">{callbackUrl}</code> after authentication.
      </p>

      <div className="mt-8">
        <button
          onClick={() => router.replace('/')}
          className="text-sky-600 hover:underline text-sm"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}
