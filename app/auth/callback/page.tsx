"use client";

export const revalidate = false;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("Finalizing sign-in…");

  useEffect(() => {
    const supabase = getSupabase();
    (async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;
        setMsg("Signed in! Redirecting…");
        router.replace("/");
      } catch (e) {
        console.error(e);
        setMsg("Could not complete sign-in. Check redirect URLs in Supabase.");
      }
    })();
  }, [router, params]);

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontWeight: 900, marginBottom: 10 }}>Auth Callback</h1>
      <p style={{ color: "#475569" }}>{msg}</p>
    </main>
  );
}
