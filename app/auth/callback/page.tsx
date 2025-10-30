"use client";

export const revalidate = 0;                      // avoid static export
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("Finalizing sign-in…");

  useEffect(() => {
    const supabase = getBrowserSupabase();

    // Supabase Auth redirect v2:
    // This exchanges the `code` in the URL for a session.
    supabase.auth.exchangeCodeForSession(window.location.href)
      .then(({ data, error }) => {
        if (error) {
          console.error("exchangeCodeForSession error:", error);
          setMessage("Sign-in failed. Please try again.");
          return;
        }

        // Optional: route to a `next` param or home
        const next = params.get("next") || "/";
        router.replace(next);
      })
      .catch((e) => {
        console.error("Callback exception:", e);
        setMessage("Sign-in failed. Please try again.");
      });
  }, [router, params]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Signing you in…</h1>
      <p>{message}</p>
    </div>
  );
}
