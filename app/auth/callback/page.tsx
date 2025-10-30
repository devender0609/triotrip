"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

// Prevent static rendering/prerender errors
export const dynamic = "force-dynamic";
export const revalidate = 0;

function CallbackInner() {
  const supabase = supabaseBrowser();
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Completing sign-in…");

  useEffect(() => {
    (async () => {
      try {
        const code = params.get("code");
        if (!code) {
          setStatus("Missing 'code' in callback URL.");
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
  }, [params, router, supabase]);

  return (
    <main className="container" style={{ maxWidth: 480, margin: "40px auto" }}>
      <p>{status}</p>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="container" style={{ maxWidth: 480, margin: "40px auto" }}>
          <p>Completing sign-in…</p>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
