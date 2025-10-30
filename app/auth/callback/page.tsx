// app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Supabase auto-exchanges the code in URL fragment.
        // Trigger a getSession to finalize and cache it.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          // Explicit exchange in case SSR stripped fragments
          const { error: e2 } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (e2) throw e2;
        }
        // Back to home (or previous)
        const next = params.get("redirect") || "/";
        router.replace(next);
      } catch (e: any) {
        setErr(e?.message || "Sign-in failed");
      }
    })();
  }, [router, params]);

  return (
    <main style={{ maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h1 style={{ margin: 0, fontWeight: 900 }}>Signing you in…</h1>
        {err && <p style={{ color: "#b91c1c" }}>{err}</p>}
      </div>
    </main>
  );
}
