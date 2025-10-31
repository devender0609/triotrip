"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = false;          // ✅ boolean, not object
export const fetchCache = "force-no-store";

export default function LoginPage() {
  const supabase = getSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [child, setChild] = useState(false);
  const [age, setAge] = useState<number | "">("");
  const [status, setStatus] = useState("");

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Sending magic link…");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setStatus(error ? `Error: ${error.message}` : "Check your email for the sign-in link.");
  }

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Signing in…");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setStatus(error ? `Error: ${error.message}` : "Signed in. Redirecting…");
    if (!error) location.replace("/");
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 24, border: "1px solid #e5e7eb", borderRadius: 12 }}>
      <h1 style={{ marginBottom: 16 }}>Sign in to TrioTrip</h1>

      <form onSubmit={onMagicLink} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
        </label>

        <label>
          Password (optional)
          <input
            type="password"
            value={password}
            placeholder="Leave blank to use email link"
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} />
          I’m a child user
        </label>

        {child && (
          <label>
            Age
            <input
              type="number"
              min={3}
              max={17}
              value={age}
              onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
          </label>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            Send magic link
          </button>
          <button onClick={onPassword} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            Sign in with password
          </button>
        </div>
      </form>

      <div style={{ marginTop: 12, color: "#334155" }}>{status}</div>
    </div>
  );
}
