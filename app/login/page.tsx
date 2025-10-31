"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export const revalidate = false;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const err = sp.get("error");

  useEffect(() => {
    // if already signed in, bounce home
    (async () => {
      const supabase = getBrowserSupabase();
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/");
    })();
  }, [router]);

  const signIn = async () => {
    try {
      setLoading(true);
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Login</h1>
      {err && (
        <div style={{ marginBottom: 12, color: "#b91c1c" }}>
          Login error: <code>{err}</code>
        </div>
      )}
      <button
        onClick={signIn}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
    </main>
  );
}
