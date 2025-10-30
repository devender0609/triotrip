"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function CallbackPage() {
  const supabase = supabaseBrowser();
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Completing sign-in…");

  useEffect(() => {
    (async () => {
      try {
        const code = params.get("code");
        if (!code) {
          setStatus("Missing 'code' in callback URL");
          return;
        }
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus(`Sign-in failed: ${error.message}`);
          return;
        }
        setStatus("Signed in! Redirecting…");
        router.replace("/");
      } catch (e: any) {
        setStatus(`Error: ${e?.message || "Network error"}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container" style={{ maxWidth: 480, margin: "40px auto" }}>
      <p>{status}</p>
    </main>
  );
}
