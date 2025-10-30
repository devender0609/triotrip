"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function signInWithGoogle() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_BASE}/auth/callback`,
      },
    });
    if (error) setMsg(error.message);
    setBusy(false);
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_BASE}/auth/callback`,
      },
    });
    if (error) setMsg(error.message);
    else setMsg("Check your email for the sign-in link.");
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Login</h1>

      <button
        className="btn btn-primary w-full mb-4"
        onClick={signInWithGoogle}
        disabled={busy}
      >
        {busy ? "Opening Google…" : "Sign in with Google"}
      </button>

      <div className="card p-4">
        <form onSubmit={sendMagicLink} className="space-y-3">
          <label className="block text-sm">Or use a magic link</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
          <button className="btn w-full" disabled={busy}>
            Send magic link
          </button>
        </form>
        {msg && <p className="text-sm mt-3">{msg}</p>}
        <p className="text-xs mt-4 text-muted">
          You’ll be redirected to <code>/auth/callback</code> after sign-in.
        </p>
      </div>
    </div>
  );
}
