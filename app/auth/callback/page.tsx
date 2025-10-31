"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = false;

export default function AuthCallbackPage() {
  const sp = useSearchParams();
  const [msg, setMsg] = useState("Finishing sign-in…");

  useEffect(() => {
    const code = sp.get("code");
    const next = sp.get("next") || "/";
    const supabase = getSupabase();

    async function run() {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setMsg("Signed in. Redirecting…");
          window.location.replace(next);
        } else {
          setMsg("No code found in URL.");
        }
      } catch (e: any) {
        setMsg(`Auth error: ${e?.message || e}`);
      }
    }
    run();
  }, [sp]);

  return <div style={{ padding: 24 }}>{msg}</div>;
}
