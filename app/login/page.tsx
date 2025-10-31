"use client";

// You can keep these, but they must be primitives — NOT objects.
export const revalidate = false;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = getSupabase();

  async function signIn(provider: "google" | "github") {
    try {
      setLoading(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
      alert("Login failed. Check Supabase redirect URLs & Vercel env vars.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontWeight: 900, marginBottom: 12 }}>Sign in to TrioTrip</h1>
      <div style={{ display: "grid", gap: 12 }}>
        <button onClick={() => signIn("google")} disabled={!!loading} style={btn}>
          {loading === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
        <button onClick={() => signIn("github")} disabled={!!loading} style={btn}>
          {loading === "github" ? "Redirecting…" : "Continue with GitHub"}
        </button>
      </div>
    </main>
  );
}
const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
