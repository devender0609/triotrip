"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // If already signed in, bounce back
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data.session) {
        const ret = sessionStorage.getItem("triptrio:returnTo") || "/";
        window.location.replace(ret);
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  async function signInGoogle() {
    setBusy(true);
    setMsg(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      // The browser will navigate to Google. No further action here.
    } catch (e: any) {
      setMsg(e?.message ?? "Could not start Google sign-in.");
      setBusy(false);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      if (error) throw error;
      setMsg("Check your email for the magic link.");
    } catch (err: any) {
      setMsg(err?.message ?? "Could not send magic link.");
    } finally {
      setBusy(false);
    }
  }

  function goHome() {
    window.location.href = "/";
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">Login</h1>

        <div className="flex flex-col gap-6">
          <button
            onClick={signInGoogle}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {busy ? "Opening Google…" : "Sign in with Google"}
          </button>

          <div className="text-gray-500 text-sm">or</div>

          <form onSubmit={sendMagicLink} className="flex items-center gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300"
            />
            <button
              type="submit"
              disabled={busy || !email}
              className="rounded-xl bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-60"
            >
              Send magic link
            </button>
          </form>

          <p className="text-sm text-gray-500">
            You’ll be redirected to <code className="text-gray-700">/auth/callback</code> after authentication.
          </p>

          {msg && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">
              {msg}
            </div>
          )}

          <button
            onClick={goHome}
            className="inline-flex w-max items-center justify-center rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </main>
  );
}
