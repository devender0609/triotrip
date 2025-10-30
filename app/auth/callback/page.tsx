"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

// Make sure this page is not statically prerendered
export const dynamic = "force-dynamic";
// IMPORTANT: revalidate must be a number or false (NOT an object)
export const revalidate = false;
// Prevent caching fetches on this page
export const fetchCache = "force-no-store";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = supabaseBrowser();

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
  }, [params, supabase, router]);

  return (
    <main style={{ maxWidth: 520, margin: "56px auto", padding: 16 }}>
      <p>{status}</p>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <main style={{ maxWidth: 520, margin: "56px auto", padding: 16 }}>
          <p>Completing sign-in…</p>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
