"use client";

import React, { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function signInGoogle() {
    try {
      setBusy(true); setErr(null); setMsg(null);
      const supabase = getSupabaseBrowser();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message || "Google sign-in failed");
      setBusy(false);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    try {
      setBusy(true); setErr(null); setMsg(null);
      const supabase = getSupabaseBrowser();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMsg("Magic link sent. Check your inbox.");
    } catch (e: any) {
      setErr(e?.message || "Could not send magic link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 16 }}>
      <div
        className="card"
        style={{
          width: 460, maxWidth: "100%", padding: 24, borderRadius: 16,
          border: "1px solid rgba(226,232,240,1)", background: "#fff",
          boxShadow: "0 20px 40px rgba(2,132,199,.08)",
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0b3b52" }}>
            Login to <span style={{ color: "#0ea5e9" }}>TrioTrip</span>
          </h1>
          <p style={{ marginTop: -6, color: "#64748b", fontWeight: 600 }}>
            Sign in to save trips and compare options later.
          </p>

          <button
            className="btn btn--primary"
            onClick={signInGoogle}
            disabled={busy}
            style={{ justifyContent: "center", height: 44 }}
          >
            {busy ? "Opening Google…" : "Continue with Google"}
          </button>

          <div className="divider" style={{ height: 1, margin: "8px 0 2px" }} />

          <form onSubmit={sendMagicLink} style={{ display: "grid", gap: 8 }}>
            <label style={{ fontWeight: 700, color: "#334155" }}>Or get a magic link</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                height: 44, padding: "0 12px", borderRadius: 12,
                border: "1px solid #e2e8f0", fontSize: 15,
              }}
            />
            <button className="btn" type="submit" disabled={busy} style={{ justifyContent: "center", height: 44 }}>
              {busy ? "Sending…" : "Send magic link"}
            </button>
          </form>

          {msg && (
            <div style={{ background: "#ecfeff", border: "1px solid #a5f3fc", padding: 10, borderRadius: 10 }}>
              ✅ {msg}
            </div>
          )}
          {err && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 10, borderRadius: 10, color: "#7f1d1d" }}>
              ⚠ {err}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 4 }}>
            <a className="chip" href="/" style={{ padding: "8px 12px" }}>← Back to home</a>
          </div>
        </div>
      </div>
    </div>
  );
}
