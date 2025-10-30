"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      const redirectBase =
        process.env.NEXT_PUBLIC_SITE_BASE ?? "https://triotrip.vercel.app";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${redirectBase}/auth/callback` },
      });
      if (error) setErr(error.message);
      else setMsg("Check your email for the magic link.");
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="card" style={{ gap: 12 }}>
        <label className="text-sm">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input"
        />
        <button className="btn" disabled={loading}>
          {loading ? "Sending…" : "Send magic link"}
        </button>
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
        {err && <p className="text-red-600 text-sm">⚠ {err}</p>}
      </form>
    </main>
  );
}
