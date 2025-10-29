"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const [msg, setMsg] = useState("Finalizing sign-in…");

  useEffect(() => {
    (async () => {
      try {
        // For PKCE flows, Supabase can read the code from the URL automatically:
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        // If there is no session yet, try exchanging the code explicitly:
        if (!data.session) {
          const url = new URL(window.location.href);
          const code = url.searchParams.get("code");
          if (code) {
            const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
            if (exErr) throw exErr;
          }
        }

        setMsg("Signed in! Redirecting…");
        const to = sessionStorage.getItem("triptrio:returnTo") || "/";
        window.location.replace(to);
      } catch (e: any) {
        setMsg(`Login error: ${e?.message || "unknown"}`);
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <div className="card" style={{ padding: 18, borderRadius: 12 }}>
        {msg}
      </div>
    </div>
  );
}
